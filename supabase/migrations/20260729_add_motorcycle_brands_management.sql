-- Marcas de moto administrables y relación opcional con los modelos.

CREATE TABLE IF NOT EXISTS public.motorcycle_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.motorcycle_models
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.motorcycle_brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_motorcycle_models_brand_id
  ON public.motorcycle_models(brand_id);

ALTER TABLE public.motorcycle_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active motorcycle brands" ON public.motorcycle_brands;
CREATE POLICY "Public can view active motorcycle brands"
ON public.motorcycle_brands FOR SELECT TO anon, authenticated
USING (activo OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage motorcycle brands" ON public.motorcycle_brands;
CREATE POLICY "Admins manage motorcycle brands"
ON public.motorcycle_brands FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

INSERT INTO public.motorcycle_brands (name, activo, orden)
VALUES
  ('Honda', true, 1),
  ('Bajaj', true, 2),
  ('Motomel', true, 3),
  ('Corven', true, 4),
  ('Zanella', true, 5)
ON CONFLICT (name) DO UPDATE SET
  activo = EXCLUDED.activo,
  orden = EXCLUDED.orden;

UPDATE public.motorcycle_models model
SET brand_id = brand.id
FROM public.motorcycle_brands brand
WHERE model.brand_id IS NULL
  AND (
    (brand.name = 'Honda' AND model.name IN ('CG / Titan / S2', 'Tornado / XR', 'Twister', 'Wave / Biz'))
    OR (brand.name = 'Bajaj' AND model.name = 'Rouser')
  );
