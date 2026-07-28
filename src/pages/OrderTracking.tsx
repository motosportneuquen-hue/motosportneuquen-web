import { FormEvent, useState } from 'react';
import { Bell, Check, MessageCircle, PackageSearch, Truck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const WHATSAPP_PHONE = '5492995343094';

const statusSteps = [
  ['pending', 'Recibido'],
  ['confirmed', 'Confirmado'],
  ['preparing', 'Preparando'],
  ['shipped', 'Enviado'],
  ['delivered', 'Entregado'],
] as const;

type TrackingNotification = {
  message: string;
  created_at: string;
};

type TrackingResult = {
  id: string;
  status: string;
  created_at: string;
  shipping_provider?: string | null;
  shipping_service?: string | null;
  tracking_number?: string | null;
  notifications?: TrackingNotification[];
};

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setResult(null);

    if (!orderNumber.trim() || phone.replace(/\D/g, '').length < 8) {
      setMessage('Ingresá el número de pedido y el mismo celular usado en la compra.');
      return;
    }
    if (!isSupabaseConfigured) {
      setMessage('El seguimiento no está disponible en este momento.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('get_public_order_tracking', {
      order_reference: orderNumber.trim(),
      buyer_phone: phone.trim(),
    });
    setLoading(false);

    if (error || !data) {
      setMessage('No encontramos un pedido con esos datos. Revisalos o consultanos por WhatsApp.');
      return;
    }
    setResult(data as TrackingResult);
  };

  const currentIndex = result ? statusSteps.findIndex(([status]) => status === result.status) : -1;
  const whatsappText = `Hola MotoSport Neuquén, quiero consultar el estado de mi pedido (${orderNumber.trim() || 'sin número a mano'}).`;

  return (
    <section className="container py-8 text-white sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 md:p-10">
          <PackageSearch className="h-12 w-12 text-primary" />
          <h1 className="mt-5 text-3xl font-black">Seguimiento de tu pedido</h1>
          <p className="mt-3 max-w-2xl text-gray-400">
            Ingresá el código recibido al comprar y tu celular. Vas a ver cada actualización registrada por el local.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              Número de pedido
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="Ej.: 123e4567..."
                className="mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-black px-4 text-white outline-none focus:border-primary"
              />
            </label>
            <label className="block text-sm font-bold">
              Celular de la compra
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Ej.: 299 5343094"
                className="mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-black px-4 text-white outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-black text-black transition hover:bg-lime-300 disabled:opacity-50 sm:col-span-2"
            >
              <PackageSearch className="h-5 w-5" /> {loading ? 'Buscando...' : 'Ver mi pedido'}
            </button>
          </form>

          {message ? <p className="mt-5 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] p-4 text-sm text-amber-100">{message}</p> : null}
        </div>

        {result ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-primary/20 bg-[#101010] p-5 sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-primary">Pedido #{result.id.slice(0, 8).toUpperCase()}</p>
                  <p className="mt-1 text-sm text-white/40">{new Date(result.created_at).toLocaleString('es-AR')}</p>
                </div>
                {result.tracking_number ? <p className="text-sm font-bold">Seguimiento: {result.tracking_number}</p> : null}
              </div>

              {result.status === 'cancelled' ? (
                <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 font-bold text-red-200">Este pedido fue cancelado.</p>
              ) : (
                <div className="mt-7 grid gap-2 sm:grid-cols-5">
                  {statusSteps.map(([status, label], index) => {
                    const complete = index <= currentIndex;
                    return (
                      <div key={status} className={`rounded-lg border p-3 ${complete ? 'border-primary/40 bg-primary/[0.08]' : 'border-white/[0.07] bg-black/20'}`}>
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${complete ? 'bg-primary text-black' : 'bg-white/10 text-white/35'}`}>
                          {complete ? <Check className="h-4 w-4" /> : index + 1}
                        </span>
                        <p className={`mt-2 text-xs font-black ${complete ? 'text-white' : 'text-white/35'}`}>{label}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {result.shipping_provider ? (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-white/[0.08] bg-black/30 p-4">
                  <Truck className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-bold">{result.shipping_provider}</p>
                    <p className="text-sm text-white/45">{result.shipping_service || 'Servicio de envío'}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#101010] p-5 sm:p-7">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black">Actualizaciones automáticas</h2>
              </div>
              <div className="mt-4 divide-y divide-white/[0.07]">
                {(result.notifications || []).map((notification) => (
                  <div key={`${notification.created_at}-${notification.message}`} className="py-3">
                    <p className="font-bold text-white/80">{notification.message}</p>
                    <p className="mt-1 text-xs text-white/35">{new Date(notification.created_at).toLocaleString('es-AR')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <a
          href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 text-sm font-black text-white transition hover:border-primary/50"
        >
          <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
        </a>
      </div>
    </section>
  );
}
