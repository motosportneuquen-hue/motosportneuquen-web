ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_grams integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS length_cm numeric(8, 2) NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS width_cm numeric(8, 2) NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS height_cm numeric(8, 2) NOT NULL DEFAULT 10;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_weight_grams_positive,
  DROP CONSTRAINT IF EXISTS products_length_cm_positive,
  DROP CONSTRAINT IF EXISTS products_width_cm_positive,
  DROP CONSTRAINT IF EXISTS products_height_cm_positive;

ALTER TABLE public.products
  ADD CONSTRAINT products_weight_grams_positive CHECK (weight_grams > 0),
  ADD CONSTRAINT products_length_cm_positive CHECK (length_cm > 0),
  ADD CONSTRAINT products_width_cm_positive CHECK (width_cm > 0),
  ADD CONSTRAINT products_height_cm_positive CHECK (height_cm > 0);

COMMENT ON COLUMN public.products.weight_grams IS 'Peso embalado usado para cotizar envios.';
COMMENT ON COLUMN public.products.length_cm IS 'Largo del paquete embalado en centimetros.';
COMMENT ON COLUMN public.products.width_cm IS 'Ancho del paquete embalado en centimetros.';
COMMENT ON COLUMN public.products.height_cm IS 'Alto del paquete embalado en centimetros.';
