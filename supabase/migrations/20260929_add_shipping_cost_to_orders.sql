BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_method text,
  ADD COLUMN IF NOT EXISTS shipping_delivery_type text,
  ADD COLUMN IF NOT EXISTS external_shipping_id text;

DROP FUNCTION IF EXISTS public.create_order_with_items(jsonb, text, text, text, text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_order_with_items(
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
  shipping_provider_name text DEFAULT NULL,
  shipping_service_name text DEFAULT NULL,
  shipping_method_id text DEFAULT NULL,
  shipping_delivery_type text DEFAULT NULL,
  shipping_cost numeric DEFAULT 0
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
  new_order_id uuid;
  quantity_requested integer;
  current_price numeric(12, 2);
  total_amount numeric(12, 2) := 0;
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

  safe_payment := CASE WHEN payment_method IN ('efectivo', 'transferencia') THEN payment_method ELSE 'transferencia' END;

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
    total_amount := total_amount + current_product.price * grouped.quantity;
  END LOOP;

  total_amount := total_amount + COALESCE(create_order_with_items.shipping_cost, 0);

  INSERT INTO public.orders (
    user_id, total_price, status, payment_method, source,
    customer_name, customer_phone, customer_email, customer_address,
    customer_locality, customer_province, customer_postal_code, customer_notes,
    shipping_provider, shipping_service, shipping_cost, shipping_method, shipping_delivery_type
  )
  VALUES (
    auth.uid(), total_amount, 'pending', safe_payment, COALESCE(NULLIF(order_source, ''), 'web'),
    btrim(buyer_name), btrim(buyer_phone), lower(btrim(buyer_email)), btrim(buyer_address),
    btrim(buyer_locality), btrim(buyer_province), upper(btrim(buyer_postal_code)), NULLIF(btrim(buyer_notes), ''),
    btrim(shipping_provider_name), btrim(shipping_service_name), COALESCE(create_order_with_items.shipping_cost, 0), btrim(shipping_method_id), btrim(create_order_with_items.shipping_delivery_type)
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

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, text, text, text, text, text, text, text, text, text, text, text, text, text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, text, text, text, text, text, text, text, text, text, text, text, text, text, text, numeric) TO anon, authenticated;

COMMIT;
