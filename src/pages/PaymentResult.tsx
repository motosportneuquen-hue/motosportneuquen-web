import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  const status = params.get('status');
  const approved = status === 'approved';
  const pending = status === 'pending';
  const Icon = approved ? CheckCircle2 : pending ? Clock3 : XCircle;
  const title = approved ? 'Pago realizado' : pending ? 'Pago pendiente' : 'No se completó el pago';
  const description = approved
    ? 'Mercado Pago está confirmando la operación. El pedido aparecerá automáticamente en el sistema del local.'
    : pending
      ? 'La operación todavía está pendiente. Te avisaremos cuando Mercado Pago la confirme.'
      : 'No se realizó ningún cobro. Podés volver a tu bolsa e intentarlo nuevamente.';

  useEffect(() => {
    if (approved) clearCart();
  }, [approved, clearCart]);

  return (
    <section className="container flex min-h-[58vh] items-center justify-center py-12">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/70 p-7 text-center shadow-2xl sm:p-10">
        <Icon className={`mx-auto h-16 w-16 ${approved ? 'text-primary' : pending ? 'text-amber-300' : 'text-red-400'}`} />
        <h1 className="mt-5 text-3xl font-black text-white">{title}</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-white/55">{description}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="rounded-lg bg-primary px-6 py-3 font-black text-black transition hover:brightness-110">
            Volver al inicio
          </Link>
          {!approved ? (
            <Link to="/cart" className="rounded-lg border border-white/15 px-6 py-3 font-black text-white transition hover:border-white/35">
              Volver a mi bolsa
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
