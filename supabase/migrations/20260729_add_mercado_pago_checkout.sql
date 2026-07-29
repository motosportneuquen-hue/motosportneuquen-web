BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS mp_preference_id text,
  ADD COLUMN IF NOT EXISTS mp_payment_id text,
  ADD COLUMN IF NOT EXISTS mp_status text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_mp_payment_id
  ON public.orders(mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_mp_preference_id
  ON public.orders(mp_preference_id)
  WHERE mp_preference_id IS NOT NULL;

COMMIT;
