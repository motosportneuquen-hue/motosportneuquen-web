import { Clock3, CreditCard, MapPin, MessageCircle, PackageCheck, ShieldCheck, Truck } from 'lucide-react';

const values = [
  { icon: PackageCheck, title: 'Repuestos para motos', text: 'Catalogo de repuestos, accesorios, indumentaria y productos para el cuidado de tu moto.' },
  { icon: MessageCircle, title: 'Atencion directa', text: 'Te asesoramos por WhatsApp para confirmar precio, stock y compatibilidad antes de comprar.' },
  { icon: ShieldCheck, title: 'Compra informada', text: 'Cada pedido se revisa y se coordina con vos antes de avanzar con el pago o el envio.' },
  { icon: Truck, title: 'Envios nacionales', text: 'Realizamos envios a todo el pais y coordinamos las condiciones para cada pedido.' },
];

export default function About() {
  return (
    <section className="container py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-purple-900/70 bg-black p-6 text-center md:p-10">
          <img src="/branding/motosport-neuquen-logo.png" alt="MotoSport Neuquén" className="mx-auto h-40 w-full object-contain md:h-56" />
          <h1 className="mt-4 text-3xl font-black md:text-5xl">Somos MotoSport Neuquén</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-300">
            Un catalogo online pensado para ayudarte a encontrar el repuesto adecuado y resolver cada compra con atencion personalizada.
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-xl border border-white/10 bg-zinc-950 p-6">
              <Icon className="h-9 w-9 text-purple-400" />
              <h2 className="mt-4 text-xl font-black">{title}</h2>
              <p className="mt-2 text-gray-300">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 grid gap-4 rounded-2xl border border-primary/20 bg-[#101010] p-5 sm:grid-cols-3 sm:p-7">
          <div className="flex gap-3"><MapPin className="h-6 w-6 shrink-0 text-primary" /><p><b>Cacique Catriel 154</b><br /><span className="text-sm text-white/45">Neuquén, Neuquén</span></p></div>
          <div className="flex gap-3"><Clock3 className="h-6 w-6 shrink-0 text-primary" /><p><b>Lun. a vie.: 9 a 21 hs</b><br /><span className="text-sm text-white/45">Sábados: 9 a 20 hs</span></p></div>
          <div className="flex gap-3"><CreditCard className="h-6 w-6 shrink-0 text-primary" /><p><b>Mercado Pago</b><br /><span className="text-sm text-white/45">Todas las tarjetas</span></p></div>
        </div>
      </div>
    </section>
  );
}
