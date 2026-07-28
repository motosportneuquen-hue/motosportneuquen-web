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
ON CONFLICT (name) DO NOTHING;

COMMIT;
