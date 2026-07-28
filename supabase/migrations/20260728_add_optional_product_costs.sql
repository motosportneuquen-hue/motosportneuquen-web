BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric(12, 2)
  CHECK (cost_price IS NULL OR cost_price >= 0);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS cost_price numeric(12, 2)
  CHECK (cost_price IS NULL OR cost_price >= 0);

CREATE OR REPLACE FUNCTION public.snapshot_order_item_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cost_price IS NULL THEN
    SELECT products.cost_price
    INTO NEW.cost_price
    FROM public.products
    WHERE products.id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS snapshot_order_item_cost ON public.order_items;
CREATE TRIGGER snapshot_order_item_cost
BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.snapshot_order_item_cost();

UPDATE public.order_items
SET cost_price = products.cost_price
FROM public.products
WHERE order_items.product_id = products.id
  AND order_items.cost_price IS NULL
  AND products.cost_price IS NOT NULL;

COMMIT;
