-- MotoSport Neuquen - instalacion completa para un proyecto Supabase nuevo.
-- Ejecutar una sola vez desde Supabase > SQL Editor > New query.

BEGIN;

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  image_url text,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  image_url text NOT NULL DEFAULT '/branding/motosport-neuquen-logo.png',
  category text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  motorcycle_model text,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  colors text[] NOT NULL DEFAULT ARRAY['Consultar'],
  is_best_seller boolean NOT NULL DEFAULT false,
  weight_grams integer NOT NULL DEFAULT 500 CHECK (weight_grams > 0),
  length_cm numeric(8, 2) NOT NULL DEFAULT 20 CHECK (length_cm > 0),
  width_cm numeric(8, 2) NOT NULL DEFAULT 15 CHECK (width_cm > 0),
  height_cm numeric(8, 2) NOT NULL DEFAULT 10 CHECK (height_cm > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_product_name_category UNIQUE (name, category)
);

CREATE TABLE IF NOT EXISTS public.motorcycle_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  address text,
  phone text,
  username text UNIQUE NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  color text,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  mensaje text NOT NULL,
  foto_url text,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Oferta especial',
  badge text NOT NULL DEFAULT 'OFERTA',
  offer_price numeric(12, 2) CHECK (offer_price IS NULL OR offer_price >= 0),
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.debtors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_name text NOT NULL,
  amount_due numeric(12, 2) NOT NULL CHECK (amount_due >= 0),
  product_name text NOT NULL,
  phone text,
  dni text,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  payment_method text,
  source text NOT NULL DEFAULT 'web',
  customer_name text,
  customer_phone text,
  shipping_provider text,
  shipping_service text,
  tracking_number text,
  admin_notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price numeric(12, 2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_model ON public.products(motorcycle_model);
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON public.products(is_best_seller, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, is_primary DESC, display_order);
CREATE INDEX IF NOT EXISTS idx_offers_active_order ON public.offers(activo, orden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.generate_unique_username(base_username text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  suffix integer := 0;
BEGIN
  IF candidate = '' THEN candidate := 'usuario'; END IF;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    suffix := suffix + 1;
    candidate := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g')) || suffix;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    public.generate_unique_username(COALESCE(split_part(NEW.email, '@', 1), 'usuario'))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_admin := false;
    ELSIF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'No tenes permisos para modificar el rol administrador';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_admin_flag() FROM PUBLIC;
DROP TRIGGER IF EXISTS protect_profile_admin_flag ON public.profiles;
CREATE TRIGGER protect_profile_admin_flag
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_flag();

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  items jsonb,
  payment_method text DEFAULT 'transferencia',
  order_source text DEFAULT 'web'
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

  safe_payment := CASE WHEN payment_method IN ('efectivo', 'transferencia') THEN payment_method ELSE 'transferencia' END;

  FOR grouped IN
    SELECT (entry ->> 'product_id')::uuid AS product_id,
           SUM((entry ->> 'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(items) AS entry
    GROUP BY (entry ->> 'product_id')::uuid
  LOOP
    IF grouped.quantity <= 0 THEN RAISE EXCEPTION 'Cantidad invalida'; END IF;
    SELECT * INTO current_product FROM public.products WHERE id = grouped.product_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto no encontrado'; END IF;
    IF current_product.stock < grouped.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para %', current_product.name;
    END IF;
    total_amount := total_amount + current_product.price * grouped.quantity;
  END LOOP;

  INSERT INTO public.orders (user_id, total_price, status, payment_method, source)
  VALUES (auth.uid(), total_amount, 'pending', safe_payment, COALESCE(NULLIF(order_source, ''), 'web'))
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

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, text, text) TO anon, authenticated;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycle_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT TO anon, authenticated USING (activo OR public.is_admin());
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view active motorcycle models" ON public.motorcycle_models FOR SELECT TO anon, authenticated USING (activo OR public.is_admin());
CREATE POLICY "Admins manage motorcycle models" ON public.motorcycle_models FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view active testimonials" ON public.testimonials FOR SELECT TO anon, authenticated USING (activo OR public.is_admin());
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view active offers" ON public.offers FOR SELECT TO anon, authenticated USING (activo OR public.is_admin());
CREATE POLICY "Admins manage offers" ON public.offers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage debtors" ON public.debtors FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Users manage own cart" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public can view product image files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Admins upload product image files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admins update product image files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin()) WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admins delete product image files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());

INSERT INTO public.categories (name, description, image_url, activo, orden)
VALUES
  ('Repuestos', 'Mecánica y mantenimiento para tu moto.', '/branding/motosport-neuquen-logo.png', true, 1),
  ('Accesorios', 'Accesorios para la moto y el conductor.', '/branding/motosport-neuquen-logo.png', true, 2),
  ('Cascos e indumentaria', 'Cascos, guantes, camperas y protección.', '/branding/motosport-neuquen-logo.png', true, 3),
  ('Cubiertas y cámaras', 'Cubiertas, cámaras, parches y válvulas.', '/branding/motosport-neuquen-logo.png', true, 4),
  ('Aceites y lubricantes', 'Aceites, grasas, lubricantes y líquidos.', '/branding/motosport-neuquen-logo.png', true, 5),
  ('Transmisión', 'Cadenas, coronas, piñones y kits.', '/branding/motosport-neuquen-logo.png', true, 6),
  ('Frenos', 'Pastillas, cintas, discos y manijas.', '/branding/motosport-neuquen-logo.png', true, 7),
  ('Electricidad', 'Baterías, luces, CDI, bobinas y bujías.', '/branding/motosport-neuquen-logo.png', true, 8),
  ('Estética y tuning', 'Plásticos, puños, espejos y detalles.', '/branding/motosport-neuquen-logo.png', true, 9)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  activo = EXCLUDED.activo,
  orden = EXCLUDED.orden;

INSERT INTO public.motorcycle_models (name, activo, orden)
VALUES
  ('110cc', true, 1),
  ('CG / Titan / S2', true, 2),
  ('Tornado / XR', true, 3),
  ('Skua', true, 4),
  ('Rouser', true, 5),
  ('Twister', true, 6),
  ('Wave / Biz', true, 7),
  ('Motomel / Corven / Zanella', true, 8)
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- PASO FINAL, despues de crear tu usuario desde la web:
-- Reemplaza el correo y ejecuta esta linea por separado.
-- UPDATE public.profiles p SET is_admin = true
-- FROM auth.users u WHERE p.id = u.id AND u.email = 'TU_CORREO';
