import { MapPin, MessageCircle, PackageCheck, Truck } from 'lucide-react';

const items = [
  { icon: MapPin, title: 'Cobertura', text: 'Realizamos envios a todo el pais.' },
  { icon: Truck, title: 'Medio de envio', text: 'La empresa o modalidad disponible se coordina segun el destino y las caracteristicas del producto.' },
  { icon: PackageCheck, title: 'Costo y plazo', text: 'Se informan antes de confirmar el pedido; no mostramos estimaciones automaticas que puedan resultar incorrectas.' },
  { icon: MessageCircle, title: 'Seguimiento', text: 'Te compartimos la informacion disponible del envio por WhatsApp.' },
];

export default function ShippingPolicy() {
  return (
    <section className="container py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 p-6 md:p-10">
        <h1 className="text-3xl font-black md:text-4xl">Envios</h1>
        <p className="mt-3 text-gray-300">Cada envio se cotiza y coordina de forma personalizada.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {items.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-xl border border-white/10 bg-black p-5">
              <Icon className="h-8 w-8 text-purple-400" />
              <h2 className="mt-3 text-xl font-black">{title}</h2>
              <p className="mt-2 text-gray-300">{text}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-400">La disponibilidad, el costo y los plazos pueden variar. Siempre te los confirmaremos antes de cerrar la compra.</p>
      </div>
    </section>
  );
}
