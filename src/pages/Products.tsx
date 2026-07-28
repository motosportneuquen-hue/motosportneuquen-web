import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, SlidersHorizontal, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import { formatARS } from '../lib/currency';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { Product } from '../types/supabase';
import { demoProducts } from '../data/demoProducts';

const motoModels = ['110cc', 'CG / Titan / S2', 'Tornado / XR', 'Skua', 'Rouser', 'Twister', 'Wave / Biz', 'Motomel / Corven / Zanella'];

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
  highlighted = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/65">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-13 w-full appearance-none rounded-xl bg-black px-4 pr-10 text-sm font-bold text-white outline-none transition focus:ring-2 focus:ring-primary/15 ${
            highlighted ? 'border border-primary/60 focus:border-primary' : 'border border-white/15 focus:border-primary'
          }`}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const modelParam = searchParams.get('model') || '';

  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    if (modelParam) setSelectedModel(modelParam);
  }, [modelParam]);

  const fetchProducts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabase.from('products').select('*');
    if (selectedCategory) query = query.eq('category', selectedCategory);
    if (selectedModel) query = query.eq('motorcycle_model', selectedModel);
    query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
    if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);

    if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
    else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
    else if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else query = query.order('category', { ascending: true }).order('name', { ascending: true });

    const { data, error } = await query;
    if (error) {
      console.error(error);
    } else {
      const normalizedSearch = searchQuery.toLocaleLowerCase('es');
      const matchingDemoProducts = demoProducts.filter((product) => {
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        const matchesModel = !selectedModel || product.motorcycle_model === selectedModel;
        const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
        const matchesSearch = !normalizedSearch || product.name.toLocaleLowerCase('es').includes(normalizedSearch);
        return matchesCategory && matchesModel && matchesPrice && matchesSearch;
      });
      setProducts([...(data || []), ...matchingDemoProducts]);
    }
    setLoading(false);
  }, [priceRange, searchQuery, selectedCategory, selectedModel, sortBy]);

  useEffect(() => {
    async function loadFilterData() {
      if (!isSupabaseConfigured) return;
      const [{ data: categoryData }, { data: productCategories }, { data: prices }] = await Promise.all([
        supabase.from('categories').select('name').order('orden', { ascending: true }),
        supabase.from('products').select('category'),
        supabase.from('products').select('price').order('price', { ascending: false }).limit(1),
      ]);

      const usedCategories = new Set((productCategories || []).map((item) => item.category));
      setCategories([...new Set((categoryData || []).map((item) => item.name))].filter((category) => usedCategories.has(category)));

      if (prices?.length) {
        const highestDemoPrice = Math.max(...demoProducts.map((product) => product.price));
        const highestPrice = Math.ceil(Math.max(prices[0].price, highestDemoPrice));
        setMaxPrice(highestPrice);
        setPriceRange([0, highestPrice]);
      } else {
        const highestPrice = Math.max(...demoProducts.map((product) => product.price));
        setMaxPrice(highestPrice);
        setPriceRange([0, highestPrice]);
      }
    }
    loadFilterData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedModel('');
    setPriceRange([0, maxPrice]);
    setSortBy('');
  };

  const activeFilterCount = [selectedCategory, selectedModel, priceRange[1] < maxPrice ? 'price' : ''].filter(Boolean).length;

  return (
    <div className="container py-8 sm:py-14">
      <div className="mb-10 max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Catálogo</p>
        <h1 className="mt-3 break-words text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
          {searchQuery ? `Resultados para "${searchQuery}"` : selectedCategory || 'Todos los productos'}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/50">
          Elegí qué buscás y el modelo de tu moto. Te mostramos solamente las opciones que sirven para vos.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 border-y border-white/10 py-4">
        <p className="text-sm text-white/50">
          <span className="font-black text-white">{products.length}</span> {products.length === 1 ? 'producto' : 'productos'}
        </p>
        <button
          onClick={() => setShowFilters((show) => !show)}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm font-black text-white md:hidden"
        >
          <Filter className="h-5 w-5" />
          {showFilters ? 'Cerrar filtros' : 'Filtrar'}
          {activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-black">{activeFilterCount}</span>}
        </button>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className={`md:w-[280px] md:shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="sticky top-40 rounded-2xl border border-white/10 bg-[#101010] p-5 sm:p-6">
            <div className="mb-7 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Encontrá tu repuesto
              </h2>
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs font-bold text-white/45 hover:text-primary">
                <X className="h-3.5 w-3.5" /> Limpiar
              </button>
            </div>

            <div className="space-y-6">
              <SelectField id="category-filter" label="Qué estás buscando" value={selectedCategory} onChange={setSelectedCategory}>
                <option value="">Todas las categorías</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </SelectField>

              <SelectField id="model-filter" label="Modelo de moto" value={selectedModel} onChange={setSelectedModel} highlighted>
                <option value="">Todos los modelos</option>
                {motoModels.map((model) => <option key={model} value={model}>{model}</option>)}
              </SelectField>

              <div>
                <label htmlFor="price-filter" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/65">Hasta qué precio</label>
                <p className="mb-3 text-xl font-black text-white">{formatARS(priceRange[1])}</p>
                <input
                  id="price-filter"
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(event) => setPriceRange([0, Number(event.target.value)])}
                  className="w-full accent-primary"
                />
              </div>

              <SelectField id="sort-filter" label="Ordenar por" value={sortBy} onChange={setSortBy}>
                <option value="">Recomendados</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="newest">Más recientes</option>
              </SelectField>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addItem}
                  onQuickView={(selectedProduct) => {
                    setQuickViewProduct(selectedProduct);
                    setIsQuickViewOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
              <p className="text-lg font-black text-white">No encontramos productos con esos filtros.</p>
              <p className="mt-2 text-sm text-white/45">Probá eligiendo “Todos los modelos” o limpiando los filtros.</p>
              <button onClick={resetFilters} className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-black text-black">Ver todos los productos</button>
            </div>
          )}
        </div>
      </div>

      {isQuickViewOpen && quickViewProduct && <QuickView product={quickViewProduct} onClose={() => setIsQuickViewOpen(false)} />}
    </div>
  );
}
