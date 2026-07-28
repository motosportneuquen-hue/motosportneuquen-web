import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

const questions = [
  { question: '¿Como hago un pedido?', answer: 'Agrega los productos al carrito y selecciona Comprar por WhatsApp. Recibiremos el detalle para coordinar la compra.' },
  { question: '¿Que significa “Precio a confirmar”?', answer: 'El valor se consulta antes de cerrar el pedido. No se cobra ni se confirma un total de $0.' },
  { question: '¿Como confirmo que el repuesto sirve para mi moto?', answer: 'Envianos por WhatsApp marca, modelo, cilindrada y año. Si hace falta, tambien podes adjuntar una foto del repuesto.' },
  { question: '¿Que formas de pago ofrecen?', answer: 'Los pedidos pueden coordinarse con pago en efectivo o transferencia.' },
  { question: '¿Realizan envios?', answer: 'Si, realizamos envios a todo el pais. El medio, costo y plazo se confirman para cada pedido.' },
  { question: '¿El stock del catalogo esta actualizado?', answer: 'El sistema controla el stock al registrar la compra. De todos modos, la confirmacion final se realiza por WhatsApp.' },
  { question: '¿Como consulto un pedido?', answer: 'Usa la pagina Consulta tu pedido o escribinos directamente por WhatsApp con el numero recibido.' },
  { question: '¿Que hago si tengo un inconveniente?', answer: 'Contactanos por WhatsApp con el numero de pedido, una descripcion y fotos si corresponde. Revisaremos el caso personalmente.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="container py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-950 p-6 md:p-10">
        <h1 className="text-3xl font-black md:text-4xl">Preguntas frecuentes</h1>
        <p className="mt-3 text-gray-300">Informacion clara para comprar y consultar en MotoSport Neuquén.</p>
        <div className="mt-7 space-y-3">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <article key={item.question} className="overflow-hidden rounded-xl border border-white/10 bg-black">
                <button onClick={() => setOpenIndex(isOpen ? null : index)} className="flex w-full items-center justify-between gap-4 p-4 text-left font-black" aria-expanded={isOpen}>
                  {item.question}
                  {isOpen ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
                </button>
                {isOpen ? <p className="border-t border-white/10 px-4 py-4 text-gray-300">{item.answer}</p> : null}
              </article>
            );
          })}
        </div>
        <a href="https://wa.me/5492995343094" target="_blank" rel="noopener noreferrer" className="mt-7 flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 font-black hover:bg-purple-700">
          <MessageCircle className="h-5 w-5" /> Hacer otra consulta
        </a>
      </div>
    </section>
  );
}
