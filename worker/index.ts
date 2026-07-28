interface Env {
  ASSETS: Fetcher;
  SHIPPING_ORIGIN_POSTAL_CODE?: string;
  CORREO_API_USER?: string;
  CORREO_API_PASSWORD?: string;
  CORREO_CUSTOMER_ID?: string;
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
    return env.ASSETS.fetch(request);
  },
};
