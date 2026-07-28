BEGIN;

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{7}$'),
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons"
ON public.coupons FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12, 2) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.validate_coupon(requested_code text)
RETURNS TABLE(code text, discount_percent integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coupons.code, coupons.discount_percent
  FROM public.coupons
  WHERE coupons.code = upper(btrim(requested_code))
    AND coupons.active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.create_order_with_items(jsonb, text, text, text, text, text, text, text, text, text, text);

CREATE FUNCTION public.create_order_with_items(
  items jsonb,
  payment_method text DEFAULT 'transferencia',
  order_source text DEFAULT 'web',
  buyer_name text DEFAULT NULL,
  buyer_phone text DEFAULT NULL,
  buyer_email text DEFAULT NULL,
  buyer_address text DEFAULT NULL,
  buyer_locality text DEFAULT NULL,
  buyer_province text DEFAULT NULL,
  buyer_postal_code text DEFAULT NULL,
  buyer_notes text DEFAULT NULL,
  coupon_code text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  grouped record;
  current_product public.products%ROWTYPE;
  matched_coupon public.coupons%ROWTYPE;
  new_order_id uuid;
  quantity_requested integer;
  current_price numeric(12, 2);
  subtotal_amount numeric(12, 2) := 0;
  discount_value numeric(12, 2) := 0;
  safe_payment text;
BEGIN
  IF items IS NULL OR jsonb_typeof(items) <> 'array' OR jsonb_array_length(items) = 0 THEN
    RAISE EXCEPTION 'El pedido no tiene productos';
  END IF;

  IF NULLIF(btrim(buyer_name), '') IS NULL
    OR NULLIF(btrim(buyer_phone), '') IS NULL
    OR NULLIF(btrim(buyer_email), '') IS NULL
    OR NULLIF(btrim(buyer_address), '') IS NULL
    OR NULLIF(btrim(buyer_locality), '') IS NULL
    OR NULLIF(btrim(buyer_province), '') IS NULL
    OR NULLIF(btrim(buyer_postal_code), '') IS NULL THEN
    RAISE EXCEPTION 'Faltan datos obligatorios del comprador';
  END IF;

  safe_payment := CASE
    WHEN payment_method IN ('efectivo', 'transferencia', 'mercado_pago', 'tarjeta_credito', 'tarjeta_debito')
      THEN payment_method
    ELSE 'transferencia'
  END;

  FOR grouped IN
    SELECT (entry ->> 'product_id')::uuid AS product_id,
           SUM((entry ->> 'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(items) AS entry
    GROUP BY (entry ->> 'product_id')::uuid
  LOOP
    IF grouped.quantity <= 0 THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;
    SELECT * INTO current_product FROM public.products WHERE id = grouped.product_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto no encontrado'; END IF;
    IF current_product.stock < grouped.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para %', current_product.name;
    END IF;
    subtotal_amount := subtotal_amount + current_product.price * grouped.quantity;
  END LOOP;

  IF NULLIF(upper(btrim(coupon_code)), '') IS NOT NULL THEN
    SELECT * INTO matched_coupon
    FROM public.coupons
    WHERE code = upper(btrim(coupon_code)) AND active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'El cupón no existe o está desactivado'; END IF;
    discount_value := round(subtotal_amount * matched_coupon.discount_percent / 100, 2);
  END IF;

  INSERT INTO public.orders (
    user_id, total_price, status, payment_method, source,
    customer_name, customer_phone, customer_email, customer_address,
    customer_locality, customer_province, customer_postal_code, customer_notes,
    coupon_code, discount_amount
  )
  VALUES (
    auth.uid(), subtotal_amount - discount_value, 'pending', safe_payment, COALESCE(NULLIF(order_source, ''), 'web'),
    btrim(buyer_name), btrim(buyer_phone), lower(btrim(buyer_email)), btrim(buyer_address),
    btrim(buyer_locality), btrim(buyer_province), upper(btrim(buyer_postal_code)), NULLIF(btrim(buyer_notes), ''),
    matched_coupon.code, discount_value
  )
  RETURNING id INTO new_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
    quantity_requested := (item ->> 'quantity')::integer;
    SELECT price INTO current_price FROM public.products WHERE id = (item ->> 'product_id')::uuid;
    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (new_order_id, (item ->> 'product_id')::uuid, quantity_requested, current_price);
  END LOOP;

  FOR grouped IN
    SELECT (entry ->> 'product_id')::uuid AS product_id,
           SUM((entry ->> 'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(items) AS entry
    GROUP BY (entry ->> 'product_id')::uuid
  LOOP
    UPDATE public.products SET stock = stock - grouped.quantity WHERE id = grouped.product_id;
  END LOOP;

  RETURN new_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, text, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated;

COMMIT;
