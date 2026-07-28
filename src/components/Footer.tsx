import { ArrowUpRight, Instagram, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const INSTAGRAM_URL = 'https://www.instagram.com/motosportneuquen/';
const WHATSAPP_URL = 'https://wa.me/5492995343094?text=Hola%20MotoSport%20Neuqu%C3%A9n%2C%20quiero%20hacer%20una%20consulta.';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#060606] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="relative h-20 w-48 overflow-hidden">
              <img src="/branding/motosport-neuquen-logo.png" alt="MotoSport Neuquén" className="absolute -top-10 left-1/2 w-48 max-w-none -translate-x-1/2" />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/45">Repuestos, accesorios e indumentaria para que disfrutes tu moto con seguridad y estilo.</p>
            <div className="mt-6 flex gap-2">
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/70 hover:border-secondary hover:text-secondary"><Instagram className="h-5 w-5" /></a>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/70 hover:border-primary hover:text-primary"><MessageCircle className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Tienda</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/45">
              <li><Link to="/products" className="hover:text-primary">Productos</Link></li>
              <li><Link to="/offers" className="hover:text-primary">Ofertas</Link></li>
              <li><Link to="/cart" className="hover:text-primary">Bolsa</Link></li>
              <li><Link to="/orders" className="hover:text-primary">Mi pedido</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Ayuda</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/45">
              <li><Link to="/shipping" className="hover:text-primary">Envíos</Link></li>
              <li><Link to="/returns" className="hover:text-primary">Cambios</Link></li>
              <li><Link to="/faq" className="hover:text-primary">Preguntas frecuentes</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contacto</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Contacto</h3>
            <div className="mt-5 space-y-4 text-sm text-white/45">
              <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /> Neuquén, Argentina<br />Envíos a todo el país</p>
              <p className="font-semibold text-white/70">+54 9 299 534-3094</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-bold text-white hover:text-primary">Escribinos por WhatsApp <ArrowUpRight className="h-4 w-4" /></a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MotoSport Neuquén. Todos los derechos reservados.</p>
          <p>Diseñado para rodar.</p>
        </div>
      </div>
    </footer>
  );
}
