import { Link } from 'react-router-dom';
import { Home, ShoppingBag, User, ShoppingCart, Info, HelpCircle, FileText, Truck } from 'lucide-react';

export default function Sitemap() {
  const sitemapSections = [
    {
      title: 'Paginas principales',
      icon: <Home className="h-5 w-5 text-primary" />,
      links: [
        { name: 'Inicio', path: '/' },
        { name: 'Productos', path: '/products' },
        { name: 'Nosotros', path: '/about' },
        { name: 'Contacto', path: '/contact' },
        { name: 'FAQ', path: '/faq' }
      ]
    },
    {
      title: 'Tienda',
      icon: <ShoppingBag className="h-5 w-5 text-primary" />,
      links: [
        { name: 'Todos los productos', path: '/products' },
        { name: 'Repuestos', path: '/products?category=Repuestos' },
        { name: 'Accesorios', path: '/products?category=Accesorios' },
        { name: 'Cascos e indumentaria', path: '/products?category=Cascos%20e%20indumentaria' },
        { name: 'Cubiertas y cámaras', path: '/products?category=Cubiertas%20y%20c%C3%A1maras' }
      ]
    },
    {
      title: 'Cuenta',
      icon: <User className="h-5 w-5 text-primary" />,
      links: [
        { name: 'Iniciar sesion / Registro', path: '/auth' },
        { name: 'Historial de pedidos', path: '/orders' },
        { name: 'Bolsa', path: '/cart' }
      ]
    },
    {
      title: 'Atencion al cliente',
      icon: <HelpCircle className="h-5 w-5 text-primary" />,
      links: [
        { name: 'Contacto', path: '/contact' },
        { name: 'Preguntas frecuentes', path: '/faq' },
        { name: 'Politica de envios', path: '/shipping' },
        { name: 'Cambios y devoluciones', path: '/returns' },
        { name: 'Seguimiento de pedido', path: '/orders' }
      ]
    },
    {
      title: 'Informacion legal',
      icon: <Info className="h-5 w-5 text-primary" />,
      links: [
        { name: 'Nosotros', path: '/about' },
        { name: 'Politica de privacidad', path: '/privacy' },
        { name: 'Terminos del servicio', path: '/terms' }
      ]
    }
  ];

  return (
    <section className="container py-10">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mapa del sitio</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Usa esta pagina para acceder rapidamente a cualquier seccion del sitio.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {sitemapSections.map((section, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-4">{section.icon}<h2 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">{section.title}</h2></div>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link to={link.path} className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors flex items-center">
                      <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></span>{link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4"><ShoppingCart className="h-6 w-6 text-primary mr-2" /><h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tienda</h2></div>
          <ul className="space-y-2">
            <li><Link to="/products" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Ver todos los productos</Link></li>
            <li><Link to="/cart" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Bolsa</Link></li>
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4"><Truck className="h-6 w-6 text-primary mr-2" /><h2 className="text-xl font-semibold text-gray-900 dark:text-white">Envios y devoluciones</h2></div>
          <ul className="space-y-2">
            <li><Link to="/shipping" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Politica de envios</Link></li>
            <li><Link to="/returns" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Cambios y devoluciones</Link></li>
            <li><Link to="/orders" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Seguimiento de pedido</Link></li>
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4"><FileText className="h-6 w-6 text-primary mr-2" /><h2 className="text-xl font-semibold text-gray-900 dark:text-white">Legal</h2></div>
          <ul className="space-y-2">
            <li><Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Terminos del servicio</Link></li>
            <li><Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Politica de privacidad</Link></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
