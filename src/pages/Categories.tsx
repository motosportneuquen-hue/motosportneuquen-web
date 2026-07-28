import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { Product } from '../types/supabase';

type Category = {
  name: string;
  count: number;
};

export default function Categorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchCategoriesAndProducts() {
      if (!isSupabaseConfigured) {
        setCategories([]);
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name, orden, created_at')
        .order('orden', { ascending: true })
        .order('created_at', { ascending: false });

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (categoriesError || productsError) {
        console.error(categoriesError || productsError);
        setLoading(false);
        return;
      }

      const loadedProducts = (productsData || []) as Product[];
      const productCountByCategory = new Map<string, number>();

      loadedProducts.forEach((product) => {
        productCountByCategory.set(product.category, (productCountByCategory.get(product.category) || 0) + 1);
      });

      const categoryNames = [
        ...(categoriesData || []).map((category) => category.name),
        ...loadedProducts.map((product) => product.category),
      ];

      const uniqueCategories = Array.from(new Set(categoryNames))
        .map((name) => ({
          name,
          count: productCountByCategory.get(name) || 0,
        }))
        .filter((category) => category.count > 0);

      setCategories(uniqueCategories);
      setProducts(loadedProducts);
      setLoading(false);
    }

    fetchCategoriesAndProducts();
  }, []);

  const visibleProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const heading = selectedCategory || 'Todos los productos';

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[420px] w-full max-w-7xl items-center justify-center px-4 py-10">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="rounded-md border border-purple-900/80 bg-black p-6 shadow-[0_0_28px_rgba(76,29,149,0.24)] md:p-8">
        <div className="mb-8 rounded-full border border-purple-800/80 bg-zinc-950 px-5 py-4 text-center text-sm font-black text-white shadow-[0_0_18px_rgba(76,29,149,0.16)]">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`transition-colors hover:text-purple-400 ${selectedCategory === '' ? 'text-purple-400' : ''}`}
          >
            Todas
          </button>
          {categories.map((category) => (
            <span key={category.name}>
              <span className="mx-2 text-purple-900/80">|</span>
              <button
                type="button"
                onClick={() => setSelectedCategory(category.name)}
                className={`transition-colors hover:text-purple-400 ${selectedCategory === category.name ? 'text-purple-400' : ''}`}
              >
                {category.name}
              </button>
            </span>
          ))}
        </div>

        <div className="mb-8 inline-flex min-w-56 items-center justify-center rounded-full border border-purple-800/80 bg-zinc-950 px-8 py-3 text-sm font-black text-white shadow-[0_0_18px_rgba(76,29,149,0.16)]">
          Productos
        </div>

        {!isSupabaseConfigured ? (
          <div className="product-sale-card mb-8 rounded-md p-4 text-white">
            Configura Supabase para cargar categorias y productos reales.
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-300">Categoria</p>
            <h1 className="font-brand mt-2 text-2xl font-black text-white md:text-4xl">{heading}</h1>
          </div>
          <p className="text-sm font-bold text-white/70">
            {visibleProducts.length} {visibleProducts.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addItem}
                onQuickView={(product) => {
                  setQuickViewProduct(product);
                  setIsQuickViewOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="product-sale-card rounded-md p-8 text-center text-white">
            No hay productos cargados en esta categoria.
          </div>
        )}
      </div>

      {isQuickViewOpen && quickViewProduct && (
        <QuickView
          product={quickViewProduct}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </section>
  );
}
