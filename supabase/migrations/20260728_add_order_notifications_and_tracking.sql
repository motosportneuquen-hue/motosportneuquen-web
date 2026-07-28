BEGIN;

CREATE TABLE IF NOT EXISTS public.order_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_notifications_order_created
  ON public.order_notifications(order_id, created_at DESC);

ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view order notifications" ON public.order_notifications;
CREATE POLICY "Admins view order notifications"
ON public.order_notifications FOR SELECT TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.create_order_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_message text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    notification_message := 'Recibimos tu pedido. El local lo revisará en breve.';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    notification_message := CASE NEW.status
      WHEN 'confirmed' THEN 'Tu pedido fue confirmado.'
      WHEN 'preparing' THEN 'Estamos preparando tu pedido.'
      WHEN 'shipped' THEN 'Tu pedido fue enviado.'
      WHEN 'delivered' THEN 'Tu pedido fue entregado.'
      WHEN 'cancelled' THEN 'Tu pedido fue cancelado. Contactanos si necesitás ayuda.'
      ELSE 'El estado de tu pedido fue actualizado.'
    END;
  ELSIF NEW.tracking_number IS DISTINCT FROM OLD.tracking_number AND NEW.tracking_number IS NOT NULL THEN
    notification_message := 'Ya está disponible el código de seguimiento de tu envío.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.order_notifications(order_id, event_type, message)
  VALUES (
    NEW.id,
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE NEW.status END,
    notification_message
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_status_notification ON public.orders;
CREATE TRIGGER order_status_notification
AFTER INSERT OR UPDATE OF status, tracking_number ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.create_order_status_notification();

INSERT INTO public.order_notifications(order_id, event_type, message, created_at)
SELECT orders.id, 'created', 'Recibimos tu pedido. El local lo revisará en breve.', orders.created_at
FROM public.orders
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_notifications
  WHERE order_notifications.order_id = orders.id
);

CREATE OR REPLACE FUNCTION public.get_public_order_tracking(
  order_reference text,
  buyer_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_order public.orders%ROWTYPE;
  clean_reference text := lower(btrim(order_reference));
  clean_phone text := regexp_replace(COALESCE(buyer_phone, ''), '\D', '', 'g');
  result jsonb;
BEGIN
  IF length(clean_reference) < 8 OR length(clean_phone) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO matched_order
  FROM public.orders
  WHERE lower(id::text) LIKE clean_reference || '%'
    AND regexp_replace(COALESCE(customer_phone, ''), '\D', '', 'g') = clean_phone
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', matched_order.id,
    'status', matched_order.status,
    'created_at', matched_order.created_at,
    'shipping_provider', matched_order.shipping_provider,
    'shipping_service', matched_order.shipping_service,
    'tracking_number', matched_order.tracking_number,
    'notifications', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'message', order_notifications.message,
          'created_at', order_notifications.created_at
        )
        ORDER BY order_notifications.created_at DESC
      )
      FROM public.order_notifications
      WHERE order_notifications.order_id = matched_order.id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_order_tracking(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order_tracking(text, text) TO anon, authenticated;

COMMIT;
