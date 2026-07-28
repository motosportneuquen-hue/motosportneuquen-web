import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Product } from '../types/supabase';
import { useCartStore } from '../store/cartStore';
import ProductCard from './ProductCard';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function loadProducts() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_best_seller', true)
        .order('created_at', { ascending: false })
        .limit(4);
      if (!error) setProducts(data || []);
      setLoading(false);
    }
    loadProducts();
  }, []);

  return (
    <div>
      <div className="mb-9 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Lo más elegido</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">Productos destacados</h2>
        </div>
        <Link to="/products" className="hidden items-center gap-2 text-sm font-bold text-white/60 transition hover:text-primary sm:flex">
          Ver catálogo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="aspect-[3/4] animate-pulse rounded-2xl bg-white/[0.05]" />)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} onAddToCart={addItem} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
          <p className="text-lg font-black text-white">El catálogo está listo para recibir tus productos.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/45">Cuando cargues productos destacados en el panel, aparecerán automáticamente en esta sección.</p>
          <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white hover:border-primary hover:text-primary">
            Explorar catálogo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
