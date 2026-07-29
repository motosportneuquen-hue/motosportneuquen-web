import { ArrowRight, Bike, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const defaultModelsByBrand: Record<string, string[]> = {
  Honda: ['CG / Titan / S2', 'Tornado / XR', 'Twister', 'Wave / Biz'],
  Bajaj: ['Rouser'],
  Motomel: ['110cc', 'Skua', 'Motomel / Corven / Zanella'],
  Corven: ['110cc', 'Motomel / Corven / Zanella'],
  Zanella: ['110cc', 'Motomel / Corven / Zanella'],
};

export default function MotoFinder() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [modelsByBrand, setModelsByBrand] = useState<Record<string, string[]>>(defaultModelsByBrand);
  const navigate = useNavigate();
  const models = useMemo(() => modelsByBrand[brand] || [], [brand, modelsByBrand]);

  useEffect(() => {
    async function loadBrandsAndModels() {
      if (!isSupabaseConfigured) return;
      const [{ data: brands, error: brandsError }, { data: models, error: modelsError }] = await Promise.all([
        supabase.from('motorcycle_brands').select('id, name').eq('activo', true).order('orden', { ascending: true }),
        supabase.from('motorcycle_models').select('name, brand_id').eq('activo', true).order('orden', { ascending: true }),
      ]);

      if (brandsError || modelsError || !brands?.length) return;

      const dynamicModels = Object.fromEntries(
        brands.map((item) => [
          item.name,
          (models || []).filter((modelItem) => modelItem.brand_id === item.id).map((modelItem) => modelItem.name),
        ])
      );
      setModelsByBrand(dynamicModels);
    }

    loadBrandsAndModels();
  }, []);

  const findProducts = () => {
    if (!model) return;
    navigate(`/products?model=${encodeURIComponent(model)}`);
  };

  return (
    <section className="border-y border-white/[0.08] bg-[#0c0c0c]">
      <div className="container py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[#111] p-6 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
                <Bike className="h-4 w-4" /> Compatibilidad rápida
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-white sm:text-4xl">
                Elegí tu moto y encontrá lo compatible
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/45">
                Seleccioná la marca y el modelo. Te mostramos solamente los repuestos y accesorios que sirven para tu moto.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-white/55">1. Marca</span>
                <span className="relative block">
                  <select
                    value={brand}
                    onChange={(event) => {
                      setBrand(event.target.value);
                      setModel('');
                    }}
                    className="h-13 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 font-bold text-white outline-none transition focus:border-primary/60"
                  >
                    <option value="">Elegir marca</option>
                    {Object.keys(modelsByBrand).map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-white/55">2. Modelo</span>
                <span className="relative block">
                  <select
                    value={model}
                    disabled={!brand}
                    onChange={(event) => setModel(event.target.value)}
                    className="h-13 w-full appearance-none rounded-xl border border-white/10 bg-black px-4 pr-10 font-bold text-white outline-none transition focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <option value="">{brand ? 'Elegir modelo' : 'Primero elegí la marca'}</option>
                    {models.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                </span>
              </label>

              <button
                type="button"
                onClick={findProducts}
                disabled={!model}
                className="mt-auto flex h-13 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-black uppercase text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Buscar <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
