import { FormEvent, useState } from 'react';
import { MessageCircle, PackageSearch } from 'lucide-react';

const WHATSAPP_PHONE = '5403534099785';

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const reference = orderNumber.trim() || 'sin numero a mano';
    const text = `Hola MotoSport Neuquén, quiero consultar el estado de mi pedido (${reference}).`;
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="container py-10 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-6 text-center md:p-10">
        <PackageSearch className="mx-auto h-14 w-14 text-purple-400" />
        <h1 className="mt-5 text-3xl font-black">Consulta tu pedido</h1>
        <p className="mt-3 text-gray-300">
          La preparacion y el envio se coordinan personalmente por WhatsApp. Escribinos con el numero de pedido para recibir el estado real.
        </p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label htmlFor="order-number" className="block text-left text-sm font-bold">Numero de pedido (opcional)</label>
          <input id="order-number" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Ej.: 123e4567..." className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white" />
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 font-black hover:bg-purple-700">
            <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
          </button>
        </form>
      </div>
    </section>
  );
}
