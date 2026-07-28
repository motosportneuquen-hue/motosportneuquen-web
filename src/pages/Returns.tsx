import { Camera, MessageCircle, PackageOpen, SearchCheck } from 'lucide-react';

const steps = [
  { icon: MessageCircle, title: 'Contactanos', text: 'Escribinos por WhatsApp e indica el numero de pedido y el producto involucrado.' },
  { icon: Camera, title: 'Envia la informacion', text: 'Contanos lo ocurrido y adjunta fotos claras del producto y del embalaje si corresponde.' },
  { icon: SearchCheck, title: 'Revision del caso', text: 'Verificaremos el pedido y te informaremos las alternativas disponibles.' },
  { icon: PackageOpen, title: 'Conserva el producto', text: 'No descartes el producto, sus piezas ni el embalaje hasta recibir indicaciones.' },
];

export default function Returns() {
  return (
    <section className="container py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 p-6 md:p-10">
        <h1 className="text-3xl font-black md:text-4xl">Cambios e inconvenientes</h1>
        <p className="mt-3 text-gray-300">Si tu pedido presenta un inconveniente, comunicate con nosotros para revisarlo personalmente.</p>
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-4">
          <p className="font-black text-amber-200">Importante sobre productos eléctricos</p>
          <p className="mt-1 text-sm text-amber-100/75">Los productos eléctricos no tienen cambio. Antes de comprar, consultanos compatibilidad y condiciones para evitar errores.</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {steps.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-xl border border-white/10 bg-black p-5">
              <Icon className="h-8 w-8 text-purple-400" />
              <h2 className="mt-3 text-xl font-black">{title}</h2>
              <p className="mt-2 text-gray-300">{text}</p>
            </article>
          ))}
        </div>
        <a href="https://wa.me/5492995343094?text=Hola%20MotoSport%20Neuqu%C3%A9n%2C%20tengo%20una%20consulta%20sobre%20un%20pedido." target="_blank" rel="noopener noreferrer" className="mt-7 flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 font-black hover:bg-purple-700">
          <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
        </a>
        <p className="mt-5 text-xs text-gray-400">Estas condiciones se aplican sin perjuicio de las garantías y derechos que correspondan conforme a la normativa vigente.</p>
      </div>
    </section>
  );
}
