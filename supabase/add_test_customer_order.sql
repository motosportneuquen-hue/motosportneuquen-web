-- Agrega un cliente y un pedido de prueba sin tocar productos ni stock.
-- Se puede ejecutar varias veces: solo mantiene un pedido de prueba activo.

INSERT INTO public.orders (
  total_price,
  status,
  payment_method,
  source,
  customer_name,
  customer_phone,
  customer_email,
  customer_address,
  customer_locality,
  customer_province,
  customer_postal_code,
  customer_notes,
  admin_notes
)
SELECT
  0,
  'confirmed',
  'transferencia',
  'admin_test',
  'CLIENTE DE PRUEBA',
  '2990000000',
  'cliente.prueba@motosportneuquen.com',
  'DIRECCION DE PRUEBA 123',
  'Neuquen',
  'Neuquen',
  '8300',
  'ESTE ES UN PEDIDO DE PRUEBA. NO PREPARAR NI ENVIAR.',
  'PEDIDO DE PRUEBA PERMANENTE. NO CONTABILIZA EN METRICAS.'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.orders
  WHERE source = 'admin_test'
    AND customer_email = 'cliente.prueba@motosportneuquen.com'
);
