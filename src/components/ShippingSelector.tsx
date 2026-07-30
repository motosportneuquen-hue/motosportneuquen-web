import { MapPin, Store, Truck } from 'lucide-react';
import { useState } from 'react';
import { formatARS } from '../lib/currency';

export type ShippingQuote = {
  id: string;
  provider: string;
  service: string;
  deliveryType: string;
  price: number;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
};

type Props = {
  postalCode: string;
  onPostalCodeChange: (value: string) => void;
  onCalculate: () => Promise<void>;
  quoting: boolean;
  quotes: ShippingQuote[];
  selected: ShippingQuote | null;
  onSelect: (quote: ShippingQuote | null) => void;
  message: string;
};

const localPickup: ShippingQuote = {
  id: 'local-pickup',
  provider: 'MotoSport Neuquén',
  service: 'Retiro en el local',
  deliveryType: 'Local',
  price: 0,
};

function QuoteOption({ quote, selected, onSelect }: { quote: ShippingQuote; selected: boolean; onSelect: () => void }) {
  return (
    <label className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition sm:p-5 ${selected ? 'border-primary bg-primary/[0.06]' : 'border-white/10 bg-white/[0.02] hover:border-white/25'}`}>
      <input type="radio" name="shipping" checked={selected} onChange={onSelect} className="mt-1 h-5 w-5 accent-[#56f000]" />
      <span className="min-w-0 flex-1">
        <span className="block font-black text-white">{quote.provider} · {quote.service}</span>
        <span className="mt-1 block text-sm text-white/45">
          {quote.deliveryDaysMin
            ? `Llega en ${quote.deliveryDaysMin}${quote.deliveryDaysMax && quote.deliveryDaysMax !== quote.deliveryDaysMin ? ` a ${quote.deliveryDaysMax}` : ''} días hábiles`
            : quote.deliveryType === 'Sucursal' ? 'Retiro en la sucursal seleccionada' : 'El plazo se confirma al despachar'}
        </span>
      </span>
      <span className={`shrink-0 font-black ${quote.price === 0 ? 'text-primary' : 'text-white'}`}>
        {quote.price === 0 ? 'Gratis' : formatARS(Math.round(quote.price))}
      </span>
    </label>
  );
}

export default function ShippingSelector({
  postalCode,
  onPostalCodeChange,
  onCalculate,
  quoting,
  quotes,
  selected,
  onSelect,
  message,
}: Props) {
  const [calculated, setCalculated] = useState(false);
  const homeQuotes = quotes.filter((quote) => quote.deliveryType !== 'Sucursal');
  const branchQuotes = quotes.filter((quote) => quote.deliveryType === 'Sucursal');

  const calculate = async () => {
    setCalculated(true);
    await onCalculate();
  };

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-white/15 bg-[#080808]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <Truck className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-black text-white">Medios de envío</h3>
          <p className="text-xs text-white/40">Calculá las opciones disponibles para tu zona.</p>
        </div>
      </div>

      {!calculated ? (
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={postalCode}
              onChange={(event) => onPostalCodeChange(event.target.value.toUpperCase())}
              placeholder="Ingresá tu código postal"
              maxLength={8}
              className="min-h-14 min-w-0 flex-1 rounded-lg border border-white/15 bg-[#eef4ff] px-5 text-lg font-bold text-black outline-none transition placeholder:text-black/45 focus:border-primary"
            />
            <button
              type="button"
              onClick={calculate}
              disabled={quoting || !postalCode.trim()}
              className="min-h-14 rounded-lg bg-white px-7 font-black uppercase tracking-wide text-black transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {quoting ? 'Calculando...' : 'Calcular'}
            </button>
          </div>
          <a href="https://www.correoargentino.com.ar/formularios/cpa" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-white underline decoration-white/40 underline-offset-4 hover:text-primary">
            No sé mi código postal
          </a>
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-white">Entregas para el CP: <span className="text-primary">{postalCode}</span></p>
            <button
              type="button"
              onClick={() => {
                setCalculated(false);
                onSelect(null);
              }}
              className="text-sm font-black uppercase text-white underline underline-offset-4 hover:text-primary"
            >
              Cambiar CP
            </button>
          </div>

          {homeQuotes.length ? (
            <section className="mb-6">
              <h4 className="mb-3 flex items-center gap-3 font-bold text-white"><Truck className="h-5 w-5 text-primary" /> Envío a domicilio</h4>
              <div className="space-y-3">
                {homeQuotes.map((quote) => <QuoteOption key={quote.id} quote={quote} selected={selected?.id === quote.id} onSelect={() => onSelect(quote)} />)}
              </div>
            </section>
          ) : null}

          {branchQuotes.length ? (
            <section className="mb-6">
              <h4 className="mb-3 flex items-center gap-3 font-bold text-white"><MapPin className="h-5 w-5 text-primary" /> Retirar por sucursal</h4>
              <div className="space-y-3">
                {branchQuotes.map((quote) => <QuoteOption key={quote.id} quote={quote} selected={selected?.id === quote.id} onSelect={() => onSelect(quote)} />)}
              </div>
            </section>
          ) : null}

          <section>
            <h4 className="mb-3 flex items-center gap-3 font-bold text-white"><Store className="h-5 w-5 text-primary" /> Nuestro local</h4>
            <label className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition sm:p-5 ${selected?.id === localPickup.id ? 'border-primary bg-primary/[0.06]' : 'border-white/10 bg-white/[0.02] hover:border-white/25'}`}>
              <input type="radio" name="shipping" checked={selected?.id === localPickup.id} onChange={() => onSelect(localPickup)} className="mt-1 h-5 w-5 accent-[#56f000]" />
              <span className="min-w-0 flex-1">
                <span className="block font-black text-white">Cacique Catriel 154, Neuquén</span>
                <span className="mt-1 block text-sm text-white/45">Lunes a viernes de 9 a 21 hs · Sábados de 9 a 20 hs</span>
              </span>
              <span className="shrink-0 font-black text-primary">Gratis</span>
            </label>
          </section>

          {message ? <p className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.05] p-3 text-xs leading-relaxed text-amber-200">{message}</p> : null}
        </div>
      )}
    </div>
  );
}
