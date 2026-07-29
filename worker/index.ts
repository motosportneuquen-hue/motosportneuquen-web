interface Env {
  ASSETS: Fetcher;
  SHIPPING_ORIGIN_POSTAL_CODE?: string;
  CORREO_API_USER?: string;
  CORREO_API_PASSWORD?: string;
  CORREO_CUSTOMER_ID?: string;
  MERCADO_PAGO_ACCESS_TOKEN?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

type QuoteRequest = {
  destinationPostalCode?: string;
  parcel?: {
    weightGrams?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const validPostalCode = (value: string) => /^[A-Z]?\d{4}[A-Z]{0,3}$/i.test(value);
const SUPABASE_URL = 'https://yloxseemdrlpimwqlhcg.supabase.co';
const validUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

type StoredOrder = {
  id: string;
  total_price: number;
  status: string;
  payment_method: string | null;
  customer_email: string | null;
  customer_name: string | null;
};

async function supabaseRequest(env: Env, path: string, init: RequestInit = {}) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Falta configurar la clave privada de Supabase en Cloudflare.');
  const headers = new Headers(init.headers);
  headers.set('apikey', env.SUPABASE_SERVICE_ROLE_KEY);
  headers.set('Authorization', `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}

async function readOrder(env: Env, orderId: string) {
  const response = await supabaseRequest(
    env,
    `orders?select=id,total_price,status,payment_method,customer_email,customer_name&id=eq.${encodeURIComponent(orderId)}&limit=1`
  );
  if (!response.ok) throw new Error('No se pudo consultar el pedido.');
  const orders = (await response.json()) as StoredOrder[];
  return orders[0] || null;
}

async function updateOrderPayment(env: Env, orderId: string, changes: Record<string, unknown>) {
  const response = await supabaseRequest(env, `orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ...changes, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error('No se pudo actualizar el pago del pedido.');
}

async function mercadoPagoRequest(env: Env, path: string, init: RequestInit = {}) {
  if (!env.MERCADO_PAGO_ACCESS_TOKEN) throw new Error('Falta configurar Mercado Pago en Cloudflare.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  return fetch(`https://api.mercadopago.com${path}`, { ...init, headers });
}

async function createMercadoPagoPreference(request: Request, env: Env) {
  let body: { orderId?: string };
  try {
    body = (await request.json()) as { orderId?: string };
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
  const orderId = String(body.orderId || '').trim();
  if (!validUuid(orderId)) return json({ error: 'Pedido inválido.' }, 400);

  try {
    const order = await readOrder(env, orderId);
    if (!order) return json({ error: 'El pedido no existe.' }, 404);
    if (!['mercado_pago', 'tarjeta_credito', 'tarjeta_debito'].includes(order.payment_method || '')) {
      return json({ error: 'El pedido no usa Mercado Pago.' }, 409);
    }
    if (order.status !== 'pending') return json({ error: 'El pedido ya fue procesado.' }, 409);
    if (!Number.isFinite(Number(order.total_price)) || Number(order.total_price) <= 0) {
      return json({ error: 'El pedido no tiene un importe válido.' }, 409);
    }

    const origin = new URL(request.url).origin;
    const response = await mercadoPagoRequest(env, '/checkout/preferences', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': `motosport-preference-${order.id}` },
      body: JSON.stringify({
        items: [{
          id: order.id,
          title: `Pedido MotoSport Neuquén #${order.id.slice(0, 8)}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: Number(order.total_price),
        }],
        payer: { name: order.customer_name || undefined, email: order.customer_email || undefined },
        external_reference: order.id,
        statement_descriptor: 'MOTOSPORT NQN',
        back_urls: {
          success: `${origin}/payment-result?status=approved&order=${order.id}`,
          pending: `${origin}/payment-result?status=pending&order=${order.id}`,
          failure: `${origin}/payment-result?status=failure&order=${order.id}`,
        },
        auto_return: 'approved',
        notification_url: `${origin}/api/payments/mercadopago/webhook`,
      }),
    });
    const payload = (await response.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
    };
    if (!response.ok || !payload.id) {
      throw new Error(payload.message || `Mercado Pago rechazó la operación (${response.status}).`);
    }
    await updateOrderPayment(env, order.id, { mp_preference_id: payload.id, mp_status: 'preference_created' });
    const checkoutUrl = payload.sandbox_init_point || payload.init_point;
    if (!checkoutUrl) throw new Error('Mercado Pago no devolvió el enlace de pago.');
    return json({ checkoutUrl });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo iniciar el pago.' }, 502);
  }
}

async function handleMercadoPagoWebhook(request: Request, env: Env) {
  try {
    const url = new URL(request.url);
    let body: { data?: { id?: string | number }; type?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      // El identificador también puede llegar por query string.
    }
    const paymentId = String(body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || '');
    const topic = body.type || url.searchParams.get('type') || url.searchParams.get('topic');
    if (!paymentId || (topic && topic !== 'payment')) return json({ received: true });

    const paymentResponse = await mercadoPagoRequest(env, `/v1/payments/${encodeURIComponent(paymentId)}`);
    if (!paymentResponse.ok) return json({ received: true });
    const payment = (await paymentResponse.json()) as {
      id?: number;
      status?: string;
      external_reference?: string;
      transaction_amount?: number;
    };
    const orderId = String(payment.external_reference || '');
    if (!validUuid(orderId)) return json({ received: true });
    const order = await readOrder(env, orderId);
    if (!order) return json({ received: true });

    if (Math.abs(Number(payment.transaction_amount) - Number(order.total_price)) >= 0.01) {
      await updateOrderPayment(env, orderId, {
        mp_payment_id: String(payment.id || paymentId),
        mp_status: 'amount_mismatch',
      });
      return json({ received: true });
    }

    const changes: Record<string, unknown> = {
      mp_payment_id: String(payment.id || paymentId),
      mp_status: payment.status || 'unknown',
    };
    if (payment.status === 'approved') {
      changes.status = 'confirmed';
      changes.paid_at = new Date().toISOString();
    }
    await updateOrderPayment(env, orderId, changes);
    return json({ received: true });
  } catch {
    return json({ error: 'No se pudo procesar la notificación.' }, 500);
  }
}

async function correoToken(env: Env) {
  const credentials = btoa(`${env.CORREO_API_USER}:${env.CORREO_API_PASSWORD}`);
  const response = await fetch('https://api.correoargentino.com.ar/micorreo/v1/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) throw new Error(`Correo Argentino rechazó la autenticación (${response.status}).`);
  const payload = (await response.json()) as { token?: string };
  if (!payload.token) throw new Error('Correo Argentino no devolvió un token.');
  return payload.token;
}

async function quoteCorreo(env: Env, destinationPostalCode: string, parcel: Required<NonNullable<QuoteRequest['parcel']>>) {
  const token = await correoToken(env);
  const response = await fetch('https://api.correoargentino.com.ar/micorreo/v1/rates', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: env.CORREO_CUSTOMER_ID,
      postalCodeOrigin: env.SHIPPING_ORIGIN_POSTAL_CODE,
      postalCodeDestination: destinationPostalCode,
      dimensions: {
        weight: parcel.weightGrams,
        height: parcel.heightCm,
        width: parcel.widthCm,
        length: parcel.lengthCm,
      },
    }),
  });

  const payload = (await response.json()) as {
    rates?: Array<{
      deliveredType?: string;
      productType?: string;
      productName?: string;
      price?: number;
      deliveryTimeMin?: number;
      deliveryTimeMax?: number;
    }>;
    message?: string;
  };
  if (!response.ok) throw new Error(payload.message || `No se pudo cotizar (${response.status}).`);

  return (payload.rates || []).map((rate, index) => ({
    id: `correo-${rate.productType || index}-${rate.deliveredType || 'D'}`,
    provider: 'Correo Argentino',
    service: rate.productName || 'Envío',
    deliveryType: rate.deliveredType === 'S' ? 'Sucursal' : 'Domicilio',
    price: Number(rate.price || 0),
    deliveryDaysMin: rate.deliveryTimeMin,
    deliveryDaysMax: rate.deliveryTimeMax,
  }));
}

async function handleQuote(request: Request, env: Env) {
  if (!env.SHIPPING_ORIGIN_POSTAL_CODE) {
    return json({ error: 'Falta configurar el código postal de origen del local.' }, 503);
  }

  let body: QuoteRequest;
  try {
    body = (await request.json()) as QuoteRequest;
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }

  const destination = String(body.destinationPostalCode || '').trim().toUpperCase();
  if (!validPostalCode(destination)) return json({ error: 'Ingresá un código postal válido.' }, 400);

  const raw = body.parcel || {};
  const parcel = {
    weightGrams: Math.round(Number(raw.weightGrams)),
    lengthCm: Math.ceil(Number(raw.lengthCm)),
    widthCm: Math.ceil(Number(raw.widthCm)),
    heightCm: Math.ceil(Number(raw.heightCm)),
  };
  if (Object.values(parcel).some((value) => !Number.isFinite(value) || value <= 0)) {
    return json({ error: 'Hay productos sin peso o medidas de envío.' }, 400);
  }
  if (parcel.weightGrams > 25000) return json({ error: 'El paquete supera el límite de 25 kg.' }, 400);

  const configured =
    env.CORREO_API_USER && env.CORREO_API_PASSWORD && env.CORREO_CUSTOMER_ID;
  if (!configured) {
    return json({
      quotes: [],
      unavailable: [
        { provider: 'Correo Argentino', reason: 'Falta cargar la cuenta API en Cloudflare.' },
        { provider: 'Andreani', reason: 'Falta cargar la credencial comercial de Andreani.' },
      ],
    });
  }

  try {
    const quotes = await quoteCorreo(env, destination, parcel);
    return json({
      quotes,
      unavailable: [{ provider: 'Andreani', reason: 'Falta cargar la credencial comercial de Andreani.' }],
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo cotizar el envío.' }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/shipping/quote') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
      return handleQuote(request, env);
    }
    if (url.pathname === '/api/payments/mercadopago/preference') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
      return createMercadoPagoPreference(request, env);
    }
    if (url.pathname === '/api/payments/mercadopago/webhook') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
      return handleMercadoPagoWebhook(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
