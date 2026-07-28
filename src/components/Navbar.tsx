import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

const INSTAGRAM_URL = 'https://www.instagram.com/speedyrepuestos/';
const WHATSAPP_URL = 'https://wa.me/5403534099785?text=Hola%20MotoSport%20Neuqu%C3%A9n%2C%20quiero%20consultar%20por%20productos.';

const links = [
  { label: 'Inicio', to: '/' },
  { label: 'Productos', to: '/products' },
  { label: 'Ofertas', to: '/offers' },
  { label: 'Nosotros', to: '/about' },
  { label: 'Contacto', to: '/contact' },
];

export default function Navbar() {
  const cartItems = useCartStore((state) => state.items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuthStore();
  const displayName = profile?.username || user?.email?.split('@')[0] || 'Mi cuenta';

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/products?search=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setAccountOpen(false);
    navigate('/');
  };

  if (location.pathname.startsWith('/admin-motosportneu')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080808]/95 text-white backdrop-blur-xl">
      <div className="bg-primary px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.18em] text-black sm:text-[11px]">
        Envíos a todo el país <span className="mx-2 opacity-40">•</span> Atención personalizada
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:gap-8">
        <Link to="/" className="flex h-11 w-24 shrink-0 items-center justify-center overflow-hidden" aria-label="Ir al inicio de MotoSport Neuquén">
          <span className="relative block h-11 w-24">
            <img
              src="/branding/motosport-neuquen-logo.png"
              alt="MotoSport Neuquén"
              className="absolute left-1/2 top-1/2 w-[92px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain mix-blend-screen"
            />
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 md:block">
          <div className="relative mx-auto max-w-xl">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="¿Qué repuesto estás buscando?"
              className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 pr-12 text-sm text-white outline-none transition focus:border-primary/60 focus:bg-white/[0.07]"
            />
            <button
              type="submit"
              aria-label="Buscar productos"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-primary text-black transition hover:bg-lime-300"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="relative hidden sm:block">
            {user ? (
              <>
                <button
                  onClick={() => setAccountOpen((open) => !open)}
                  className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden lg:inline">{displayName}</span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-12 w-44 rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl">
                    <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10">
                      <LogOut className="h-4 w-4" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/auth" className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white">
                <User className="h-5 w-5" />
                <span className="hidden lg:inline">Mi cuenta</span>
              </Link>
            )}
          </div>

          <Link to="/cart" className="relative flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white">
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden lg:inline">Carrito</span>
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-black text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <nav className="hidden border-t border-white/[0.06] lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-10 px-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] transition ${
                location.pathname === link.to ? 'text-primary' : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
              {location.pathname === link.to && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
            </Link>
          ))}
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="py-3 text-xs font-black uppercase tracking-[0.15em] text-white/70 hover:text-white">
            Instagram
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="py-3 text-xs font-black uppercase tracking-[0.15em] text-white/70 hover:text-white">
            WhatsApp
          </a>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-zinc-950 px-4 py-4 lg:hidden">
          <form onSubmit={handleSearch} className="mb-4 md:hidden">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar productos"
                className="h-11 w-full rounded-full border border-white/15 bg-white/[0.06] px-4 pr-11 text-sm outline-none focus:border-primary"
              />
              <button type="submit" aria-label="Buscar productos" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>
          <div className="grid grid-cols-2 gap-2">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
