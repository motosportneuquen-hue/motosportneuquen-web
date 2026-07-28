-- MotoSport Neuquen: sincronizacion segura del proyecto actual.
-- Ejecutar en Supabase > SQL Editor. Se puede volver a ejecutar sin duplicar datos.

BEGIN;

CREATE TABLE IF NOT EXISTS public.motorcycle_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.motorcycle_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active motorcycle models" ON public.motorcycle_models;
CREATE POLICY "Public can view active motorcycle models"
ON public.motorcycle_models FOR SELECT TO anon, authenticated
USING (activo OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage motorcycle models" ON public.motorcycle_models;
CREATE POLICY "Admins manage motorcycle models"
ON public.motorcycle_models FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

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
ON CONFLICT (name) DO UPDATE SET activo = EXCLUDED.activo, orden = EXCLUDED.orden;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS motorcycle_model text,
  ADD COLUMN IF NOT EXISTS is_best_seller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weight_grams integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS length_cm numeric(8, 2) NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS width_cm numeric(8, 2) NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS height_cm numeric(8, 2) NOT NULL DEFAULT 10;

INSERT INTO public.products
  (name, description, price, image_url, category, motorcycle_model, stock, is_best_seller, weight_grams, length_cm, width_cm, height_cm)
VALUES
  ('Casco integral Street Pro', 'Casco integral liviano con visor transparente.', 189900, 'https://placehold.co/900x900/f3f3f3/151515?text=Casco+integral+Street+Pro', 'Cascos e indumentaria', '110cc', 8, true, 1600, 38, 28, 28),
  ('Cubierta 90/90-18 urbana', 'Cubierta urbana de uso diario con buen agarre.', 86500, 'https://placehold.co/900x900/f3f3f3/151515?text=Cubierta+90%2F90-18', 'Cubiertas y cámaras', 'CG / Titan / S2', 6, true, 3500, 62, 62, 12),
  ('Kit transmisión reforzado', 'Corona, piñón y cadena para renovación completa.', 118000, 'https://placehold.co/900x900/f3f3f3/151515?text=Kit+transmision', 'Transmisión', 'CG / Titan / S2', 5, true, 2600, 35, 28, 8),
  ('Guantes Rider negros', 'Guantes con protección y ajuste regulable.', 42900, 'https://placehold.co/900x900/f3f3f3/151515?text=Guantes+Rider', 'Cascos e indumentaria', 'Rouser', 12, true, 350, 28, 18, 8),
  ('Pastillas de freno delanteras', 'Compuesto de frenado para uso urbano y mixto.', 28900, 'https://placehold.co/900x900/f3f3f3/151515?text=Pastillas+de+freno', 'Frenos', 'Tornado / XR', 14, false, 300, 16, 12, 5),
  ('Espejos deportivos universales', 'Par de espejos compactos con brazo regulable.', 57900, 'https://placehold.co/900x900/f3f3f3/151515?text=Espejos+deportivos', 'Accesorios', 'Motomel / Corven / Zanella', 9, false, 900, 32, 22, 12),
  ('Pedalines aluminio verde', 'Pedalines anchos de aluminio con mejor apoyo.', 97600, 'https://placehold.co/900x900/f3f3f3/151515?text=Pedalines+aluminio', 'Accesorios', 'Tornado / XR', 4, false, 1200, 25, 18, 10),
  ('Faro LED redondo 7 pulgadas', 'Iluminación LED blanca de bajo consumo.', 74900, 'https://placehold.co/900x900/f3f3f3/151515?text=Faro+LED', 'Electricidad', 'Skua', 7, false, 1100, 24, 24, 18),
  ('Cubre puños térmicos', 'Protección para las manos en días fríos.', 65900, 'https://placehold.co/900x900/f3f3f3/151515?text=Cubre+punos', 'Accesorios', 'Rouser', 10, false, 550, 32, 22, 12),
  ('Filtro de aire alto flujo', 'Filtro lavable para mantenimiento periódico.', 39700, 'https://placehold.co/900x900/f3f3f3/151515?text=Filtro+de+aire', 'Repuestos', 'Twister', 11, false, 450, 24, 20, 10),
  ('Baúl trasero 45 litros', 'Baúl rígido con espacio para casco y objetos personales.', 159900, 'https://placehold.co/900x900/f3f3f3/151515?text=Baul+45+litros', 'Accesorios', 'Wave / Biz', 3, false, 4200, 58, 44, 36),
  ('Cámara reforzada 18 pulgadas', 'Cámara reforzada para rueda de 18 pulgadas.', 24900, 'https://placehold.co/900x900/f3f3f3/151515?text=Camara+18+pulgadas', 'Cubiertas y cámaras', 'Motomel / Corven / Zanella', 16, false, 800, 28, 20, 10)
ON CONFLICT (name, category) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  motorcycle_model = EXCLUDED.motorcycle_model,
  stock = EXCLUDED.stock,
  is_best_seller = EXCLUDED.is_best_seller,
  weight_grams = EXCLUDED.weight_grams,
  length_cm = EXCLUDED.length_cm,
  width_cm = EXCLUDED.width_cm,
  height_cm = EXCLUDED.height_cm;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
UPDATE public.orders SET status = 'delivered' WHERE status = 'completed';
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS shipping_provider text,
  ADD COLUMN IF NOT EXISTS shipping_service text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

COMMIT;
