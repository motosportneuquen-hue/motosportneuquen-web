import { ArrowRight, ChevronRight, Headphones, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeaturedProducts from '../components/FeaturedProducts';

const categories = [
  { name: 'Repuestos', copy: 'Todo para mantener tu moto siempre lista.' },
  { name: 'Accesorios', copy: 'Detalles que cambian tu forma de rodar.' },
  { name: 'Cascos e indumentaria', copy: 'Protección y estilo para cada salida.' },
  { name: 'Cubiertas y cámaras', copy: 'Agarre y seguridad para cada terreno.' },
];

const benefits = [
  { icon: Truck, title: 'Envíos nacionales', text: 'Llegamos a todo el país.' },
  { icon: Headphones, title: 'Asesoramiento real', text: 'Te ayudamos a elegir bien.' },
  { icon: ShieldCheck, title: 'Compra segura', text: 'Confirmamos cada pedido.' },
  { icon: PackageCheck, title: 'Stock actualizado', text: 'Información clara y directa.' },
];

export default function Home() {
  return (
    <div className="pb-20">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_45%,rgba(185,0,230,0.16),transparent_32%),radial-gradient(circle_at_12%_5%,rgba(85,230,0,0.10),transparent_28%)]" />
        <div className="relative mx-auto grid min-h-[520px] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.25em] text-primary">
              <span className="h-px w-10 bg-primary" /> Moto repuestos en Neuquén
            </p>
            <h1 className="text-balance text-5xl font-black uppercase leading-[0.94] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Tu moto.
              <span className="block text-primary">A tu manera.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Repuestos, accesorios e indumentaria seleccionados para que encuentres lo correcto sin perder tiempo.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/products" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:-translate-y-0.5 hover:bg-lime-300">
                Ver catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/15 px-7 py-3.5 text-sm font-black uppercase tracking-wider text-white transition hover:border-secondary hover:bg-secondary/10">
                Pedir asesoramiento
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden aspect-square w-full max-w-[390px] items-center justify-center lg:flex">
            <div className="absolute h-[76%] w-[76%] rounded-full border border-primary/20 bg-primary/[0.04]" />
            <div className="absolute h-[94%] w-[94%] rounded-full border border-secondary/20" />
            <div className="absolute left-[6%] top-[15%] h-3 w-3 rounded-full bg-primary shadow-[0_0_24px_#55e600]" />
            <div className="absolute bottom-[10%] right-[10%] h-4 w-4 rounded-full bg-secondary shadow-[0_0_26px_#b900e6]" />
            <img src="/branding/motosport-neuquen-logo.png" alt="MotoSport Neuquén" className="relative z-10 w-[78%] mix-blend-screen drop-shadow-[0_20px_50px_rgba(0,0,0,0.65)]" />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/[0.07] px-4 sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3 px-3 py-5 sm:px-5">
              <Icon className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-black text-white">{title}</p>
                <p className="mt-1 text-xs text-white/45">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-9 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-secondary">Encontrá lo tuyo</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">Categorías</h2>
          </div>
          <Link to="/products" className="hidden items-center gap-1 text-sm font-bold text-white/60 hover:text-primary sm:flex">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={`/products?category=${encodeURIComponent(category.name)}`}
              className="group relative min-h-52 overflow-hidden rounded-xl border border-white/[0.08] bg-[#101010] p-6 transition hover:-translate-y-0.5 hover:border-primary/35"
            >
              <span className="text-7xl font-black text-white/[0.035]">0{index + 1}</span>
              <div className="absolute inset-x-6 bottom-6">
                <h3 className="text-xl font-black text-white transition group-hover:text-primary">{category.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{category.copy}</p>
                <ArrowRight className="mt-5 h-5 w-5 text-secondary transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <FeaturedProducts />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:pt-24">
        <div className="relative overflow-hidden rounded-3xl border border-secondary/25 bg-[#101010] px-6 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between lg:py-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">¿No sabés cuál elegir?</p>
            <h2 className="mt-3 text-3xl font-black uppercase text-white sm:text-5xl">Te ayudamos a encontrar el repuesto correcto.</h2>
          </div>
          <a href="https://wa.me/5492995343094?text=Hola%20MotoSport%20Neuqu%C3%A9n%2C%20necesito%20asesoramiento." target="_blank" rel="noreferrer" className="relative mt-8 inline-flex min-h-13 items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-black uppercase text-black transition hover:bg-primary lg:mt-0">
            Hablar por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
