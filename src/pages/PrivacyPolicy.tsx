import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Que informacion usamos',
    text: 'Si creas una cuenta, usamos el correo electronico y los datos de perfil que ingreses. Al registrar un pedido se guardan los productos, cantidades, forma de pago elegida y el usuario asociado cuando corresponde.',
  },
  {
    title: 'Para que la usamos',
    text: 'La informacion se utiliza para autenticar tu cuenta, administrar pedidos, responder consultas, coordinar pagos y envios, mantener la seguridad del sitio y mejorar el catalogo.',
  },
  {
    title: 'Servicios externos',
    text: 'La autenticacion y los datos del catalogo se gestionan mediante Supabase. Cuando elegis contactarnos por WhatsApp o Instagram, la comunicacion pasa a estar sujeta tambien a las politicas de esas plataformas.',
  },
  {
    title: 'Conservacion y seguridad',
    text: 'Conservamos la informacion durante el tiempo necesario para gestionar la relacion comercial y cumplir obligaciones aplicables. Aplicamos controles de acceso para limitar la administracion de datos y no almacenamos datos de tarjetas en este sitio.',
  },
  {
    title: 'Tus consultas sobre datos',
    text: 'Podes solicitar acceso, correccion o eliminacion de tus datos cuando corresponda. Escribinos por el canal de contacto e indica el correo asociado a tu cuenta para que podamos identificar la solicitud.',
  },
];

export default function PrivacyPolicy() {
  return (
    <section className="container py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 p-6 md:p-10">
        <h1 className="font-brand text-3xl font-black md:text-4xl">Politica de privacidad</h1>
        <p className="mt-3 text-sm text-gray-400">Ultima actualizacion: 18 de julio de 2026.</p>

        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="mt-2 leading-relaxed text-gray-200">{section.text}</p>
            </article>
          ))}
        </div>

        <p className="mt-8 border-t border-white/10 pt-6 text-gray-200">
          Para hacer una consulta, usa nuestra pagina de{' '}
          <Link to="/contact" className="font-bold text-purple-400 hover:text-purple-300">contacto</Link>.
        </p>
      </div>
    </section>
  );
}
