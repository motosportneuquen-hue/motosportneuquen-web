BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS transfer_price numeric(12, 2)
  CHECK (transfer_price IS NULL OR transfer_price >= 0);

COMMIT;
