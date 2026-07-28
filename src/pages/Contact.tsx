import { FormEvent, useState } from 'react';
import { Instagram, MessageCircle, Send } from 'lucide-react';

const WHATSAPP_PHONE = '5403534099785';
const INSTAGRAM_URL = 'https://www.instagram.com/speedyrepuestos/';

export default function Contact() {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Consulta por un producto');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text =
      `Hola MotoSport Neuquén. Soy ${name.trim()}.\n` +
      `Motivo: ${subject}.\n` +
      `Consulta: ${message.trim()}`;
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="container py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 p-6 md:p-10">
        <h1 className="text-3xl font-black md:text-4xl">Contactanos</h1>
        <p className="mt-3 max-w-2xl text-gray-300">
          Escribinos por WhatsApp para consultar precios, compatibilidad, stock o coordinar tu pedido.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.5fr]">
          <div className="space-y-4">
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-purple-800/70 bg-black p-4 hover:bg-purple-950/40"
            >
              <MessageCircle className="h-6 w-6 text-purple-400" />
              <span><strong>WhatsApp</strong><br /><small className="text-gray-300">Atencion y pedidos</small></span>
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-black p-4 hover:bg-white/5"
            >
              <Instagram className="h-6 w-6 text-purple-400" />
              <span><strong>@speedyrepuestos</strong><br /><small className="text-gray-300">Novedades e ingresos</small></span>
            </a>
            <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
              Realizamos envios a todo el pais. El costo, el medio y el plazo se coordinan antes de confirmar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-black/60 p-5">
            <label className="block text-sm font-bold">
              Tu nombre
              <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-zinc-900 px-4 py-3 text-white" />
            </label>
            <label className="block text-sm font-bold">
              Motivo
              <select value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-zinc-900 px-4 py-3 text-white">
                <option>Consulta por un producto</option>
                <option>Compatibilidad con mi moto</option>
                <option>Precio y forma de pago</option>
                <option>Estado de un pedido</option>
                <option>Cambio o inconveniente</option>
              </select>
            </label>
            <label className="block text-sm font-bold">
              Mensaje
              <textarea required rows={6} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-zinc-900 px-4 py-3 text-white" />
            </label>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 font-black hover:bg-purple-700">
              <Send className="h-5 w-5" /> Enviar por WhatsApp
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
