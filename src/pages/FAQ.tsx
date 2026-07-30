import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

const questions = [
  { question: '¿Cómo hago un pedido?', answer: 'Agregá los productos a la bolsa, completá tus datos, elegí la entrega y seleccioná el medio de pago. Si pagás online, te llevamos de forma segura a Mercado Pago.' },
  { question: '¿Qué significa “Precio a confirmar”?', answer: 'El valor se consulta antes de cerrar el pedido. No se cobra ni se confirma un total de $0.' },
  { question: '¿Cómo confirmo que el repuesto sirve para mi moto?', answer: 'Elegí la marca y el modelo en el buscador de compatibilidad o envianos por WhatsApp los datos de tu moto.' },
  { question: '¿Qué formas de pago ofrecen?', answer: 'Aceptamos efectivo, transferencia, Mercado Pago y tarjetas de crédito o débito procesadas de forma segura por Mercado Pago.' },
  { question: '¿Dónde están y en qué horarios atienden?', answer: 'Estamos en Cacique Catriel 154, Neuquén. Atendemos de lunes a viernes de 9 a 21 hs y los sábados de 9 a 20 hs.' },
  { question: '¿Realizan envíos?', answer: 'Sí, realizamos envíos a todo el país. Podés calcular las opciones disponibles ingresando tu código postal en la bolsa.' },
  { question: '¿El stock del catálogo está actualizado?', answer: 'Sí. En pagos online el stock se descuenta cuando Mercado Pago confirma el cobro; en transferencia o efectivo se reserva al registrar el pedido.' },
  { question: '¿Cómo consulto un pedido?', answer: 'Usá la página “Mi pedido” con el código recibido y el mismo celular informado durante la compra.' },
  { question: '¿Qué hago si tengo un inconveniente?', answer: 'Contactanos por WhatsApp con el número de pedido, una descripción y fotos si corresponde. Revisaremos el caso personalmente.' },
  { question: '¿Los productos eléctricos tienen cambio?', answer: 'No. Los productos eléctricos no tienen cambio. Recomendamos confirmar compatibilidad y condiciones antes de comprarlos.' },
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
