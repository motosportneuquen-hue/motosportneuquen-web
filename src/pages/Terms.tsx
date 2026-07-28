const sections = [
  {
    title: 'Uso del catalogo',
    paragraphs: [
      'El sitio permite consultar productos y preparar pedidos para MotoSport Neuquén. Las imagenes y descripciones ayudan a identificar cada articulo, pero ante dudas de compatibilidad conviene confirmar el modelo, ano y version de la moto antes de avanzar.',
    ],
  },
  {
    title: 'Precios, stock y confirmacion',
    paragraphs: [
      'Los importes se expresan en pesos argentinos. Cuando un producto indica "Precio a confirmar", el valor se acuerda antes de concretar la operacion.',
      'El stock puede cambiar. El pedido queda sujeto a la confirmacion final de disponibilidad, precio, pago y entrega por los canales de contacto informados en el sitio.',
    ],
  },
  {
    title: 'Pagos',
    paragraphs: [
      'Las opciones mostradas son efectivo y transferencia. Los datos necesarios para completar el pago se coordinan directamente con MotoSport Neuquén. Este sitio no solicita ni almacena datos de tarjetas.',
    ],
  },
  {
    title: 'Envios',
    paragraphs: [
      'El medio de envio, costo, plazo estimado y datos de seguimiento se informan al coordinar cada pedido. Los tiempos pueden variar por destino, disponibilidad y transportista.',
    ],
  },
  {
    title: 'Cambios, inconvenientes y garantia',
    paragraphs: [
      'Si recibis un producto con un problema o distinto de lo coordinado, contactanos con el numero de pedido, una descripcion y fotos. Cada caso se revisa segun el producto y la normativa aplicable.',
      'Estas condiciones no limitan los derechos que correspondan a consumidores conforme a la legislacion argentina.',
    ],
  },
  {
    title: 'Cuenta y seguridad',
    paragraphs: [
      'Sos responsable de mantener la confidencialidad de tus credenciales. Si detectas un acceso que no reconoces, comunicate con nosotros para revisar el caso.',
    ],
  },
  {
    title: 'Privacidad y contacto',
    paragraphs: [
      'El tratamiento de la informacion personal se explica en la Politica de privacidad. Las consultas comerciales y sobre estos terminos se reciben mediante los canales publicados en la pagina de contacto.',
    ],
  },
];

export default function Terms() {
  return (
    <section className="container py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 p-6 md:p-10">
        <h1 className="font-brand text-3xl font-black md:text-4xl">Terminos y condiciones</h1>
        <p className="mt-3 text-sm text-gray-400">Ultima actualizacion: 18 de julio de 2026.</p>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <div className="mt-2 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed text-gray-200">{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
