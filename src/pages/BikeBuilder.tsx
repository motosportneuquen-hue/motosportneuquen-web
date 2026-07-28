import { ArrowLeft, Bike, Check, MousePointer2, Rotate3D, ShoppingBag, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MotorcycleScene, { BikePart } from '../components/bike-builder/MotorcycleScene';
import { formatProductPrice } from '../lib/currency';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { Product } from '../types/supabase';

const modelsByBrand: Record<string, string[]> = {
  Honda: ['CG / Titan / S2', 'Tornado / XR', 'Twister', 'Wave / Biz'],
  Bajaj: ['Rouser'],
  Motomel: ['110cc', 'Skua', 'Motomel / Corven / Zanella'],
  Corven: ['110cc', 'Motomel / Corven / Zanella'],
  Zanella: ['110cc', 'Motomel / Corven / Zanella'],
};

const partInfo: Record<BikePart, { label: string; hint: string; match: string[] }> = {
  escape: { label: 'Escape', hint: 'Sonido y rendimiento', match: ['escape', 'silenciador', 'mofle'] },
  ruedas: { label: 'Ruedas', hint: 'Cubiertas y cámaras', match: ['cubierta', 'cámara', 'rueda', 'neumático'] },
  manubrio: { label: 'Manubrio', hint: 'Control y posición', match: ['manubrio', 'puño', 'espejo', 'manija'] },
  luces: { label: 'Luces', hint: 'Iluminación y ópticas', match: ['faro', 'led', 'luz', 'óptica', 'guiño'] },
  frenos: { label: 'Frenos', hint: 'Discos y pastillas', match: ['freno', 'pastilla', 'disco', 'cinta'] },
  carroceria: { label: 'Carrocería', hint: 'Estética y protección', match: ['plástico', 'carenado', 'gráfico', 'asiento', 'tanque', 'pechera'] },
};

const partOrder = Object.keys(partInfo) as BikePart[];
const colors = ['#55e600', '#b900e6', '#e8e8e8', '#ef3340', '#1c64f2', '#111111'];

export default function BikeBuilder() {
  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('Tornado / XR');
  const [activePart, setActivePart] = useState<BikePart | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuredParts, setConfiguredParts] = useState<Partial<Record<BikePart, string>>>({});
  const [bodyColor, setBodyColor] = useState('#55e600');
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('name', { ascending: true });
    if (!error) {
      setProducts(((data || []) as Product[]).filter((product) => (
        !product.motorcycle_model || product.motorcycle_model === model
      )));
    }
    setLoading(false);
  }, [model]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const compatibleProducts = useMemo(() => {
    if (!activePart) return [];
    const terms = partInfo[activePart].match;
    return products.filter((product) => {
      const text = `${product.name} ${product.category} ${product.description}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return terms.some((term) => text.includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));
    });
  }, [activePart, products]);

  const selectedProducts = useMemo(
    () => Object.entries(configuredParts)
      .map(([part, productId]) => ({ part: part as BikePart, product: products.find((item) => item.id === productId) }))
      .filter((item): item is { part: BikePart; product: Product } => Boolean(item.product)),
    [configuredParts, products]
  );

  const total = selectedProducts.reduce((sum, item) => sum + Number(item.product.price || 0), 0);

  const chooseModel = (nextBrand: string) => {
    setBrand(nextBrand);
    setModel(modelsByBrand[nextBrand][0]);
    setConfiguredParts({});
    setActivePart(null);
  };

  return (
    <div className="min-h-screen bg-[#080808] pb-16 text-white">
      <div className="container py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="mt-6 flex flex-col gap-3 border-b border-white/[0.08] pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-4 w-4" /> Experiencia interactiva
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">Armá tu moto</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              Girala, elegí una zona y descubrí repuestos compatibles. Tu configuración se puede agregar directamente a la Bolsa.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-white/35">
            <Rotate3D className="h-4 w-4 text-primary" /> Arrastrá para girar · rueda para acercar
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_330px]">
          <aside className="order-2 rounded-xl border border-white/[0.08] bg-[#111] p-4 lg:order-1">
            <div className="flex items-center gap-2">
              <Bike className="h-5 w-5 text-primary" />
              <h2 className="font-black">Elegí tu moto</h2>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-[11px] font-black uppercase tracking-wider text-white/45">
                Marca
                <select value={brand} onChange={(event) => chooseModel(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black px-3 font-bold text-white">
                  {Object.keys(modelsByBrand).map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="block text-[11px] font-black uppercase tracking-wider text-white/45">
                Modelo
                <select
                  value={model}
                  onChange={(event) => {
                    setModel(event.target.value);
                    setConfiguredParts({});
                    setActivePart(null);
                  }}
                  className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black px-3 font-bold text-white"
                >
                  {modelsByBrand[brand].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-6 border-t border-white/[0.08] pt-5">
              <p className="text-[11px] font-black uppercase tracking-wider text-white/45">Color principal</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBodyColor(color)}
                    aria-label={`Elegir color ${color}`}
                    className={`h-8 w-8 rounded-full border-2 transition ${bodyColor === color ? 'scale-110 border-white' : 'border-white/10'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-white/[0.08] pt-5">
              <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-white/45">Zonas de la moto</p>
              <div className="space-y-1.5">
                {partOrder.map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setActivePart(part)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${activePart === part ? 'bg-primary text-black' : 'text-white/65 hover:bg-white/[0.05] hover:text-white'}`}
                  >
                    <span>
                      <span className="block text-sm font-black">{partInfo[part].label}</span>
                      <span className={`block text-[11px] ${activePart === part ? 'text-black/55' : 'text-white/30'}`}>{partInfo[part].hint}</span>
                    </span>
                    {configuredParts[part] ? <Check className="h-4 w-4" /> : <MousePointer2 className="h-4 w-4 opacity-40" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="order-1 overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909] lg:order-2">
            <div className="relative h-[430px] sm:h-[560px] lg:h-[680px]">
              <MotorcycleScene activePart={activePart} onSelectPart={setActivePart} configuredParts={configuredParts} bodyColor={bodyColor} />
              <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/65 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/55 backdrop-blur">
                {brand} · {model}
              </div>
              {!activePart ? (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-xl border border-white/10 bg-black/65 p-3 text-center text-xs text-white/50 backdrop-blur">
                  Tocá una parte de la moto o elegí una zona del menú
                </div>
              ) : null}
            </div>
          </main>

          <aside className="order-3 rounded-xl border border-white/[0.08] bg-[#111] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Piezas compatibles</p>
                <h2 className="mt-1 text-xl font-black">{activePart ? partInfo[activePart].label : 'Elegí una zona'}</h2>
              </div>
              {activePart ? <button onClick={() => setActivePart(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05]"><X className="h-4 w-4" /></button> : null}
            </div>

            <div className="mt-4 max-h-[390px] space-y-2 overflow-y-auto pr-1 lg:max-h-[430px]">
              {loading ? <p className="py-8 text-center text-sm text-white/35">Buscando productos...</p> : null}
              {!loading && activePart && compatibleProducts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 p-5 text-center">
                  <p className="text-sm font-bold text-white/65">No hay productos compatibles cargados para esta zona.</p>
                  <Link to="/contact" className="mt-3 inline-block text-xs font-black text-primary">Consultar por WhatsApp</Link>
                </div>
              ) : null}
              {compatibleProducts.map((product) => {
                const selected = activePart ? configuredParts[activePart] === product.id : false;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => activePart && setConfiguredParts((current) => ({ ...current, [activePart]: product.id }))}
                    className={`flex w-full gap-3 rounded-lg border p-2.5 text-left transition ${selected ? 'border-primary/60 bg-primary/[0.08]' : 'border-white/[0.07] bg-black/20 hover:border-white/20'}`}
                  >
                    <img src={product.image_url} alt="" className="h-16 w-16 shrink-0 rounded-md bg-white object-contain p-1" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-black text-white">{product.name}</span>
                      <span className="mt-1 block text-sm font-black text-primary">{formatProductPrice(Math.round(product.price))}</span>
                    </span>
                    {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 border-t border-white/[0.08] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/45">{selectedProducts.length} piezas elegidas</span>
                <span className="text-xl font-black text-white">{formatProductPrice(Math.round(total))}</span>
              </div>
              <button
                type="button"
                disabled={selectedProducts.length === 0}
                onClick={() => {
                  selectedProducts.forEach(({ product }) => addItem(product));
                  setAdded(true);
                  window.setTimeout(() => setAdded(false), 2200);
                }}
                className={`mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-35 ${
                  added ? 'bg-white text-black' : 'bg-primary text-black hover:bg-lime-300'
                }`}
              >
                {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                {added ? 'Agregada a la Bolsa' : 'Agregar configuración'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
