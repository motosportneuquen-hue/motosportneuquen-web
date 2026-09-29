interface Env {
  ASSETS: Fetcher;
  SHIPPING_ORIGIN_POSTAL_CODE?: string;
  CORREO_API_USER?: string;
  CORREO_API_PASSWORD?: string;
  CORREO_CUSTOMER_ID?: string;
  ANDREANI_USER?: string;
  ANDREANI_PASS?: string;
  ANDREANI_CLIENT_CODE?: string;
  ANDREANI_CONTRACT_DOMICILIO?: string;
  ANDREANI_CONTRACT_SUCURSAL?: string;
  MERCADO_PAGO_ACCESS_TOKEN?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  ORDER_NOTIFICATION_EMAIL?: string;
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
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_locality?: string | null;
  customer_province?: string | null;
  customer_postal_code?: string | null;
  shipping_provider?: string | null;
  shipping_service?: string | null;
  tracking_number?: string | null;
  order_items?: Array<{
    quantity: number;
    price: number;
    products?: { name?: string | null } | null;
  }>;
};

type OrderEmailEvent = 'created' | 'paid' | 'status';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);

const paymentNames: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercado_pago: 'Mercado Pago',
  tarjeta_credito: 'Tarjeta de crédito',
  tarjeta_debito: 'Tarjeta de débito',
};

const statusNames: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

async function supabaseRequest(env: Env, path: string, init: RequestInit = {}) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Falta configurar la clave privada de Supabase en Cloudflare.');
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY.trim();
  const headers = new Headers(init.headers);
  headers.set('apikey', supabaseKey);
  if (!supabaseKey.startsWith('sb_secret_')) {
    headers.set('Authorization', `Bearer ${supabaseKey}`);
  }
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

async function readOrderDetails(env: Env, orderId: string) {
  const select = [
    'id', 'total_price', 'status', 'payment_method', 'customer_email', 'customer_name',
    'customer_phone', 'customer_address', 'customer_locality', 'customer_province',
    'customer_postal_code', 'shipping_provider', 'shipping_service', 'tracking_number',
    'order_items(quantity,price,products(name))',
  ].join(',');
  const response = await supabaseRequest(
    env,
    `orders?select=${encodeURIComponent(select)}&id=eq.${encodeURIComponent(orderId)}&limit=1`
  );
  if (!response.ok) throw new Error('No se pudo consultar el detalle del pedido.');
  const orders = (await response.json()) as StoredOrder[];
  return orders[0] || null;
}

function emailFrame(title: string, preheader: string, content: string) {
  return `<!doctype html>
  <html lang="es">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;background:#070707;color:#f5f5f5;font-family:Arial,sans-serif">
      <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>
      <div style="max-width:620px;margin:0 auto;padding:28px 16px">
        <div style="border:1px solid #262626;border-radius:18px;overflow:hidden;background:#111">
          <div style="height:6px;background:linear-gradient(90deg,#52ed00,#b000ef)"></div>
          <div style="padding:26px">
            <p style="margin:0 0 8px;color:#52ed00;font-size:12px;font-weight:800;letter-spacing:2px">MOTOSPORT NEUQUÉN</p>
            <h1 style="margin:0 0 22px;font-size:28px;line-height:1.15">${escapeHtml(title)}</h1>
            ${content}
          </div>
        </div>
        <p style="margin:16px 0 0;text-align:center;color:#777;font-size:12px">
          Cacique Catriel 154, Neuquén · WhatsApp 299 534-3094
        </p>
      </div>
    </body>
  </html>`;
}

function orderItemsHtml(order: StoredOrder) {
  const rows = (order.order_items || []).map((item) => {
    const name = item.products?.name || 'Producto';
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #292929;color:#eee">${escapeHtml(name)} × ${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #292929;text-align:right;color:#eee">${escapeHtml(formatMoney(Number(item.price) * item.quantity))}</td>
    </tr>`;
  }).join('');
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:18px 0">${rows}</table>`;
}

async function sendOrderEmails(env: Env, order: StoredOrder, event: OrderEmailEvent) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !env.ORDER_NOTIFICATION_EMAIL) {
    throw new Error('Falta configurar Resend en Cloudflare.');
  }

  const shortId = order.id.slice(0, 8).toUpperCase();
  const state = statusNames[order.status] || order.status;
  const eventTitle = event === 'paid'
    ? 'Pago confirmado'
    : event === 'status'
      ? `Pedido ${state.toLowerCase()}`
      : 'Pedido recibido';
  const address = [
    order.customer_address,
    order.customer_locality,
    order.customer_province,
    order.customer_postal_code ? `CP ${order.customer_postal_code}` : null,
  ].filter(Boolean).join(', ');
  const shipment = [order.shipping_provider, order.shipping_service].filter(Boolean).join(' · ') || 'A coordinar';
  const tracking = order.tracking_number
    ? `<p style="margin:8px 0"><strong>Seguimiento:</strong> ${escapeHtml(order.tracking_number)}</p>`
    : '';

  const summary = `
    <div style="border-radius:12px;background:#090909;padding:16px;color:#cfcfcf">
      <p style="margin:0 0 8px"><strong style="color:#fff">Pedido:</strong> #${shortId}</p>
      <p style="margin:0 0 8px"><strong style="color:#fff">Estado:</strong> ${escapeHtml(state)}</p>
      <p style="margin:0 0 8px"><strong style="color:#fff">Pago:</strong> ${escapeHtml(paymentNames[order.payment_method || ''] || order.payment_method || 'A coordinar')}</p>
      <p style="margin:0 0 8px"><strong style="color:#fff">Entrega:</strong> ${escapeHtml(shipment)}</p>
      ${tracking}
      <p style="margin:0"><strong style="color:#fff">Dirección:</strong> ${escapeHtml(address || 'A coordinar')}</p>
    </div>
    ${orderItemsHtml(order)}
    <p style="margin:18px 0 0;font-size:22px;font-weight:800;color:#52ed00">Total: ${escapeHtml(formatMoney(Number(order.total_price)))}</p>`;

  const customerHtml = emailFrame(
    eventTitle,
    `${eventTitle} · Pedido #${shortId}`,
    `<p style="color:#bbb;line-height:1.6">Hola ${escapeHtml(order.customer_name || '')}, te informamos el estado de tu compra.</p>${summary}`
  );
  const adminHtml = emailFrame(
    `${eventTitle}: #${shortId}`,
    `Novedad del pedido #${shortId}`,
    `<div style="color:#bbb;line-height:1.6">
      <p><strong style="color:#fff">Cliente:</strong> ${escapeHtml(order.customer_name || 'Sin nombre')}</p>
      <p><strong style="color:#fff">Celular:</strong> ${escapeHtml(order.customer_phone || 'Sin celular')}</p>
      <p><strong style="color:#fff">Email:</strong> ${escapeHtml(order.customer_email || 'Sin email')}</p>
    </div>${summary}`
  );

  const emails: Array<Record<string, unknown>> = [{
    from: env.RESEND_FROM_EMAIL,
    to: [env.ORDER_NOTIFICATION_EMAIL],
    reply_to: order.customer_email || undefined,
    subject: `${eventTitle} · Pedido #${shortId}`,
    html: adminHtml,
  }];
  if (order.customer_email) {
    emails.push({
      from: env.RESEND_FROM_EMAIL,
      to: [order.customer_email],
      reply_to: env.ORDER_NOTIFICATION_EMAIL,
      subject: `${eventTitle} · Pedido #${shortId}`,
      html: customerHtml,
    });
  }

  const response = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `motosport-${event}-${order.status}-${order.id}`,
    },
    body: JSON.stringify(emails),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || `Resend rechazó el envío (${response.status}).`);
  }
}

async function handleOrderNotification(request: Request, env: Env) {
  let body: { orderId?: string; event?: OrderEmailEvent };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
  const orderId = String(body.orderId || '').trim();
  const event = body.event;
  if (!validUuid(orderId) || !event || !['created', 'paid', 'status'].includes(event)) {
    return json({ error: 'Notificación inválida.' }, 400);
  }
  try {
    const order = await readOrderDetails(env, orderId);
    if (!order) return json({ error: 'El pedido no existe.' }, 404);
    if (event === 'created' && ['mercado_pago', 'tarjeta_credito', 'tarjeta_debito'].includes(order.payment_method || '')) {
      return json({ error: 'El pedido online todavía no está pagado.' }, 409);
    }
    if (event === 'paid' && order.status !== 'confirmed') {
      return json({ error: 'El pago todavía no está confirmado.' }, 409);
    }
    await sendOrderEmails(env, order, event);
    return json({ sent: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo enviar la notificación.' }, 502);
  }
}

async function updateOrderPayment(env: Env, orderId: string, changes: Record<string, unknown>) {
  const response = await supabaseRequest(env, `orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ...changes, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error('No se pudo actualizar el pago del pedido.');
}

async function confirmPaidOrder(env: Env, orderId: string, paymentId: string, amount: number) {
  const response = await supabaseRequest(env, 'rpc/confirm_mercado_pago_order', {
    method: 'POST',
    body: JSON.stringify({
      requested_order_id: orderId,
      requested_payment_id: paymentId,
      requested_amount: amount,
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || 'No se pudo confirmar el stock del pedido.');
  }
}

async function mercadoPagoRequest(env: Env, path: string, init: RequestInit = {}) {
  if (!env.MERCADO_PAGO_ACCESS_TOKEN) throw new Error('Falta configurar Mercado Pago en Cloudflare.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN.trim()}`);
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
    const checkoutUrl = payload.init_point || payload.sandbox_init_point;
    if (!checkoutUrl) throw new Error('Mercado Pago no devolvió el enlace de pago.');
    return json({ checkoutUrl });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo iniciar el pago.' }, 502);
  }
}

async function handleMercadoPagoWebhook(request: Request, env: Env, ctx: ExecutionContext) {
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

    if (payment.status === 'approved') {
      await confirmPaidOrder(
        env,
        orderId,
        String(payment.id || paymentId),
        Number(payment.transaction_amount)
      );
      ctx.waitUntil(
        readOrderDetails(env, orderId)
          .then((paidOrder) => paidOrder ? sendOrderEmails(env, paidOrder, 'paid') : undefined)
          .catch(() => undefined)
      );
    } else {
      await updateOrderPayment(env, orderId, {
        mp_payment_id: String(payment.id || paymentId),
        mp_status: payment.status || 'unknown',
      });
    }
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

async function andreaniLogin(env: Env): Promise<string> {
  if (!env.ANDREANI_USER || !env.ANDREANI_PASS) throw new Error('Faltan credenciales de Andreani.');
  const credentials = btoa(`${env.ANDREANI_USER}:${env.ANDREANI_PASS}`);
  const response = await fetch('https://apis.andreani.com/login', {
    method: 'GET',
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!response.ok) throw new Error(`Andreani rechazó la autenticación (${response.status}).`);
  const token = response.headers.get('x-authorization-token');
  if (!token) throw new Error('Andreani no devolvió el token de sesión.');
  return token;
}

async function quoteAndreani(
  env: Env,
  destinationPostalCode: string,
  parcel: Required<NonNullable<QuoteRequest['parcel']>>,
) {
  const token = await andreaniLogin(env);
  const kilos = Math.max(parcel.weightGrams / 1000, 0.1);
  const volumen = parcel.lengthCm * parcel.widthCm * parcel.heightCm;
  const contracts = [
    { contrato: env.ANDREANI_CONTRACT_DOMICILIO!, deliveryType: 'Domicilio' },
    { contrato: env.ANDREANI_CONTRACT_SUCURSAL!, deliveryType: 'Sucursal' },
  ].filter((c) => c.contrato);

  const results: Array<{
    id: string;
    provider: string;
    service: string;
    deliveryType: string;
    price: number;
    deliveryDaysMin?: number;
    deliveryDaysMax?: number;
  }> = [];

  for (const { contrato, deliveryType } of contracts) {
    const params = new URLSearchParams({
      cliente: env.ANDREANI_CLIENT_CODE!,
      contrato,
      cpDestino: destinationPostalCode.replace(/^[A-Z]/i, '').replace(/[A-Z]+$/i, ''),
      'bultos[0][kilos]': kilos.toFixed(2),
      'bultos[0][volumen]': String(volumen),
      'bultos[0][largoCm]': String(parcel.lengthCm),
      'bultos[0][anchoCm]': String(parcel.widthCm),
      'bultos[0][altoCm]': String(parcel.heightCm),
      'bultos[0][valorDeclarado]': '1',
    });

    try {
      const response = await fetch(`https://apis.andreani.com/v1/tarifas?${params}`, {
        headers: { 'x-authorization-token': token },
      });
      if (!response.ok) continue;
      const data = (await response.json()) as {
        tarifaConIva?: { total?: string };
      };
      const price = Number(data.tarifaConIva?.total || 0);
      if (price > 0) {
        results.push({
          id: `andreani-${deliveryType.toLowerCase()}`,
          provider: 'Andreani',
          service: deliveryType === 'Sucursal' ? 'Retiro en punto Andreani' : 'Envío a domicilio',
          deliveryType,
          price,
        });
      }
    } catch {
      // silently skip this contract type
    }
  }
  return results;
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

  const correoConfigured = env.CORREO_API_USER && env.CORREO_API_PASSWORD && env.CORREO_CUSTOMER_ID;
  const andreaniConfigured = env.ANDREANI_USER && env.ANDREANI_PASS && env.ANDREANI_CLIENT_CODE;

  if (!correoConfigured && !andreaniConfigured) {
    return json({
      quotes: [],
      unavailable: [
        { provider: 'Correo Argentino', reason: 'Falta cargar la cuenta API en Cloudflare.' },
        { provider: 'Andreani', reason: 'Falta cargar la credencial comercial de Andreani.' },
      ],
    });
  }

  const promises: Array<Promise<Array<{ id: string; provider: string; service: string; deliveryType: string; price: number; deliveryDaysMin?: number; deliveryDaysMax?: number }>>> = [];
  const unavailable: Array<{ provider: string; reason: string }> = [];

  if (correoConfigured) {
    promises.push(quoteCorreo(env, destination, parcel));
  } else {
    promises.push(Promise.resolve([]));
    unavailable.push({ provider: 'Correo Argentino', reason: 'Falta cargar la cuenta API en Cloudflare.' });
  }

  if (andreaniConfigured) {
    promises.push(quoteAndreani(env, destination, parcel));
  } else {
    promises.push(Promise.resolve([]));
    unavailable.push({ provider: 'Andreani', reason: 'Falta cargar la credencial comercial de Andreani.' });
  }

  try {
    const results = await Promise.allSettled(promises);
    const quotes: Array<{ id: string; provider: string; service: string; deliveryType: string; price: number; deliveryDaysMin?: number; deliveryDaysMax?: number }> = [];

    if (results[0].status === 'fulfilled') {
      quotes.push(...results[0].value);
    } else {
      unavailable.push({ provider: 'Correo Argentino', reason: results[0].reason?.message || 'Error al cotizar.' });
    }

    if (results[1].status === 'fulfilled') {
      quotes.push(...results[1].value);
    } else {
      unavailable.push({ provider: 'Andreani', reason: results[1].reason?.message || 'Error al cotizar.' });
    }

    return json({ quotes, unavailable: unavailable.length ? unavailable : undefined });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo cotizar el envío.' }, 502);
  }
}
async function handleShippingCreate(request: Request, env: Env) {
  let body: { orderId?: string; provider?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'Solicitud inv\u00e1lida.' }, 400);
  }
  const orderId = String(body.orderId || '').trim();
  const provider = String(body.provider || '').trim();
  if (!validUuid(orderId)) return json({ error: 'Pedido inv\u00e1lido.' }, 400);
  if (!['andreani', 'correo_argentino'].includes(provider)) {
    return json({ error: 'Proveedor inv\u00e1lido. Usar "andreani" o "correo_argentino".' }, 400);
  }

  try {
    const order = await readOrderDetails(env, orderId);
    if (!order) return json({ error: 'El pedido no existe.' }, 404);

    // Calculate consolidated parcel from order items
    const totalWeight = (order.order_items || []).reduce((sum, item) => sum + item.quantity, 0) * 500; // fallback weight
    const weightKg = Math.max(totalWeight / 1000, 0.1);

    let trackingNumber = '';
    let externalId = '';

    if (provider === 'andreani') {
      if (!env.ANDREANI_USER || !env.ANDREANI_PASS || !env.ANDREANI_CLIENT_CODE) {
        return json({ error: 'Faltan credenciales de Andreani.' }, 503);
      }
      const token = await andreaniLogin(env);
      const contrato = env.ANDREANI_CONTRACT_DOMICILIO || env.ANDREANI_CONTRACT_SUCURSAL || '';

      const cpNumeric = (order.customer_postal_code || '8300')
        .replace(/^[A-Z]/i, '').replace(/[A-Z]+$/i, '');

      const payload = {
        contrato,
        origen: {
          postal: {
            codigoPostal: env.SHIPPING_ORIGIN_POSTAL_CODE || '8300',
            calle: 'Cacique Catriel',
            numero: '154',
            localidad: 'Neuqu\u00e9n',
            pais: 'Argentina',
          },
        },
        destino: {
          postal: {
            codigoPostal: cpNumeric,
            calle: order.customer_address || '',
            numero: '',
            localidad: order.customer_locality || '',
            region: '',
            pais: 'Argentina',
          },
        },
        remitente: {
          nombreCompleto: 'MotoSport Neuqu\u00e9n',
          email: env.ORDER_NOTIFICATION_EMAIL || '',
          telefonos: [{ tipo: 1, numero: '2995343094' }],
        },
        destinatario: [{
          nombreCompleto: order.customer_name || 'Cliente',
          email: order.customer_email || '',
          telefonos: [{ tipo: 1, numero: (order.customer_phone || '').replace(/\D/g, '') }],
        }],
        productoAEntregar: `Pedido #${order.id.slice(0, 8).toUpperCase()}`,
        bultos: [{
          kilos: weightKg,
          largoCm: 30,
          altoCm: 20,
          anchoCm: 20,
          volumenCm: 12000,
          valorDeclaradoSinImpuestos: Number(order.total_price) || 1,
          valorDeclaradoConImpuestos: Number(order.total_price) || 1,
          referencias: [{ meta: 'idCliente', contenido: order.id }],
        }],
      };

      const response = await fetch('https://apis.andreani.com/v2/ordenes-de-envio', {
        method: 'POST',
        headers: {
          'x-authorization-token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        bultos?: Array<{ numeroDeEnvio?: string }>;
        estado?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(result.message || `Andreani rechaz\u00f3 el env\u00edo (${response.status}).`);

      trackingNumber = result.bultos?.[0]?.numeroDeEnvio || '';
      externalId = trackingNumber;
    } else {
      // Correo Argentino
      if (!env.CORREO_API_USER || !env.CORREO_API_PASSWORD || !env.CORREO_CUSTOMER_ID) {
        return json({ error: 'Faltan credenciales de Correo Argentino.' }, 503);
      }
      const token = await correoToken(env);

      const payload = {
        customerId: env.CORREO_CUSTOMER_ID,
        extOrderId: order.id,
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        recipient: {
          name: order.customer_name || 'Cliente',
          email: order.customer_email || '',
          phone: (order.customer_phone || '').replace(/\D/g, ''),
          cellPhone: (order.customer_phone || '').replace(/\D/g, ''),
        },
        shipping: {
          deliveryType: 'D',
          address: {
            streetName: order.customer_address || '',
            streetNumber: '',
            floor: '',
            apartment: '',
            city: order.customer_locality || '',
            provinceCode: 'Q',
            postalCode: order.customer_postal_code || '',
          },
          weight: Math.round(weightKg * 1000),
          declaredValue: Number(order.total_price) || 1,
          height: 20,
          length: 30,
          width: 20,
        },
      };

      const response = await fetch('https://api.correoargentino.com.ar/micorreo/v1/shipping/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errorData?.message || `Correo Argentino rechaz\u00f3 el env\u00edo (${response.status}).`);
      }

      externalId = order.id;
      trackingNumber = `CA-${order.id.slice(0, 8).toUpperCase()}`;
    }

    // Update order with tracking info
    if (trackingNumber || externalId) {
      await supabaseRequest(env, `orders?id=eq.${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          tracking_number: trackingNumber || undefined,
          external_shipping_id: externalId || undefined,
          shipping_provider: provider === 'andreani' ? 'Andreani' : 'Correo Argentino',
          status: 'shipped',
          updated_at: new Date().toISOString(),
        }),
      });
    }

    return json({ trackingNumber, externalId });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo crear el env\u00edo.' }, 502);
  }
}

async function handleShippingLabel(request: Request, env: Env) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const trackingNumber = decodeURIComponent(parts[parts.length - 1] || '');
  const provider = url.searchParams.get('provider') || 'andreani';

  if (!trackingNumber) return json({ error: 'Falta el n\u00famero de seguimiento.' }, 400);

  try {
    if (provider === 'andreani') {
      if (!env.ANDREANI_USER || !env.ANDREANI_PASS) {
        return json({ error: 'Faltan credenciales de Andreani.' }, 503);
      }
      const token = await andreaniLogin(env);
      const response = await fetch(
        `https://apis.andreani.com/v2/ordenes-de-envio/${encodeURIComponent(trackingNumber)}/etiquetas`,
        { headers: { 'x-authorization-token': token } }
      );
      if (!response.ok) throw new Error(`No se pudo obtener la etiqueta (${response.status}).`);

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        return new Response(response.body, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="etiqueta-${trackingNumber}.pdf"`,
            'Cache-Control': 'no-store',
          },
        });
      }

      // JSON response with base64
      const data = (await response.json()) as { fileBase64?: string; pdf?: string };
      const base64 = data.fileBase64 || data.pdf;
      if (!base64) throw new Error('Andreani no devolvi\u00f3 la etiqueta.');

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

      return new Response(bytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="etiqueta-${trackingNumber}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Correo Argentino label - requires PAQ.AR API
    return json({ error: 'La generaci\u00f3n de etiquetas de Correo Argentino requiere la API PAQ.AR. Generá la etiqueta desde el portal de MiCorreo.' }, 501);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo obtener la etiqueta.' }, 502);
  }
}

async function handleShippingTrack(request: Request, env: Env) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const trackingNumber = decodeURIComponent(parts[parts.length - 1] || '');
  const provider = url.searchParams.get('provider') || 'andreani';

  if (!trackingNumber) return json({ error: 'Falta el n\u00famero de seguimiento.' }, 400);

  try {
    if (provider === 'andreani') {
      if (!env.ANDREANI_USER || !env.ANDREANI_PASS) {
        return json({ error: 'Faltan credenciales de Andreani.' }, 503);
      }
      const token = await andreaniLogin(env);
      const response = await fetch(
        `https://apis.andreani.com/v1/envios/${encodeURIComponent(trackingNumber)}/trazas`,
        { headers: { 'x-authorization-token': token } }
      );
      if (!response.ok) {
        if (response.status === 404) return json({ events: [], message: 'El env\u00edo a\u00fan no tiene movimientos registrados.' });
        throw new Error(`No se pudo consultar el seguimiento (${response.status}).`);
      }
      const data = (await response.json()) as {
        eventos?: Array<{
          Fecha?: string;
          Estado?: string;
          Traduccion?: string;
          Sucursal?: string;
        }>;
      };
      const events = (data.eventos || []).map((e) => ({
        date: e.Fecha || '',
        status: e.Estado || '',
        description: e.Traduccion || e.Estado || '',
        location: e.Sucursal || '',
      }));
      return json({ provider: 'Andreani', trackingNumber, events });
    }

    // Correo Argentino tracking
    return json({ error: 'El seguimiento de Correo Argentino se realiza desde correoargentino.com.ar con el c\u00f3digo de seguimiento.' }, 501);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo consultar el seguimiento.' }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
      return handleMercadoPagoWebhook(request, env, ctx);
    }
    if (url.pathname === '/api/notifications/order') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
      return handleOrderNotification(request, env);
    }
    if (url.pathname === '/api/shipping/create') {
      if (request.method !== 'POST') return json({ error: 'M\u00e9todo no permitido.' }, 405);
      return handleShippingCreate(request, env);
    }
    if (url.pathname.startsWith('/api/shipping/label/')) {
      if (request.method !== 'GET') return json({ error: 'M\u00e9todo no permitido.' }, 405);
      return handleShippingLabel(request, env);
    }
    if (url.pathname.startsWith('/api/shipping/track/')) {
      if (request.method !== 'GET') return json({ error: 'M\u00e9todo no permitido.' }, 405);
      return handleShippingTrack(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
