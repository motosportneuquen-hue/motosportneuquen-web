import { useState } from 'react';
import { ShoppingCart, Trash2, ArrowLeft, Plus, Minus, Banknote, CreditCard, Landmark, WalletCards, TicketPercent, ChevronRight, Check } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Link } from 'react-router-dom';
import { formatARS } from '../lib/currency';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import ShippingSelector, { type ShippingQuote } from '../components/ShippingSelector';

type PaymentMethod = 'efectivo' | 'transferencia' | 'mercado_pago' | 'tarjeta_credito' | 'tarjeta_debito';
type BuyerData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  locality: string;
  province: string;
  postalCode: string;
  notes: string;
};
const WHATSAPP_PHONE = '5492995343094';

function paymentLabel(method: PaymentMethod) {
  switch (method) {
    case 'efectivo':
      return 'Efectivo';
    case 'transferencia':
      return 'Transferencia';
    case 'mercado_pago':
      return 'Mercado Pago';
    case 'tarjeta_credito':
      return 'Tarjeta de crédito';
    case 'tarjeta_debito':
      return 'Tarjeta de débito';
    default:
      return method;
  }
}

const paymentOptions = [
  { value: 'transferencia', label: 'Transferencia', hint: 'Transferencia bancaria', icon: Landmark },
  { value: 'efectivo', label: 'Efectivo', hint: 'A coordinar con el local', icon: Banknote },
  { value: 'mercado_pago', label: 'Mercado Pago', hint: 'Desde tu cuenta de Mercado Pago', icon: WalletCards },
  { value: 'tarjeta_credito', label: 'Crédito', hint: 'Todas las tarjetas de crédito', icon: CreditCard },
  { value: 'tarjeta_debito', label: 'Débito', hint: 'Todas las tarjetas de débito', icon: CreditCard },
] as const;

export default function Cart() {
  const cartItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercado_pago');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingQuote | null>(null);
  const [shippingMessage, setShippingMessage] = useState('');
  const [quotingShipping, setQuotingShipping] = useState(false);
  const [buyer, setBuyer] = useState<BuyerData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    locality: '',
    province: '',
    postalCode: '',
    notes: '',
  });

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(cartItemId);
    } else {
      updateQuantity(cartItemId, newQuantity);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.round(subtotal * couponPercent / 100);
  const shipping = selectedShipping?.price || 0;
  const total = subtotal - discount + shipping;
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasPendingPrices = cartItems.some((item) => item.price <= 0);
  const hasDemoItems = cartItems.some((item) => item.product_id.startsWith('demo-'));

  const formatItemPrice = (price: number) =>
    price > 0 ? formatARS(Math.round(price)) : 'Precio a confirmar';

  const formatOrderTotal = () => {
    if (!hasPendingPrices) return formatARS(Math.round(total));
    if (total <= 0) return 'Precio total a confirmar';
    return `${formatARS(Math.round(total))} + precios a confirmar`;
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    setCouponCode(code);
    setCouponMessage('');
    setCouponPercent(0);
    if (!code) {
      setCouponMessage('Ingresá un código.');
      return;
    }
    setValidatingCoupon(true);
    const { data, error } = await supabase.rpc('validate_coupon', { requested_code: code });
    const coupon = Array.isArray(data) ? data[0] : null;
    if (error || !coupon) {
      setCouponMessage('El cupón no existe o está desactivado.');
    } else {
      setCouponPercent(Number(coupon.discount_percent));
      setCouponMessage(`Cupón aplicado: ${coupon.discount_percent}% de descuento.`);
    }
    setValidatingCoupon(false);
  };

  const quoteShipping = async () => {
    setQuotingShipping(true);
    setShippingMessage('');
    setShippingQuotes([]);
    setSelectedShipping(null);

    if (cartItems.length > 0 && cartItems.every((item) => item.free_shipping)) {
      const freeQuote: ShippingQuote = {
        id: 'free-shipping',
        provider: 'MotoSport Neuquén',
        service: 'Envío gratis',
        deliveryType: 'A coordinar',
        price: 0,
      };
      setShippingQuotes([freeQuote]);
      setSelectedShipping(freeQuote);
      setShippingMessage('Este pedido tiene envío gratis.');
      setQuotingShipping(false);
      return;
    }

    const missingDimensions = cartItems.some(
      (item) => !item.weight_grams || !item.length_cm || !item.width_cm || !item.height_cm
    );
    if (missingDimensions) {
      setShippingMessage('Hay productos sin peso o medidas. Podés pedir el envío por WhatsApp.');
      setQuotingShipping(false);
      return;
    }

    const parcel = {
      weightGrams: cartItems.reduce((sum, item) => sum + Number(item.weight_grams) * item.quantity, 0),
      lengthCm: Math.max(...cartItems.map((item) => Number(item.length_cm))),
      widthCm: Math.max(...cartItems.map((item) => Number(item.width_cm))),
      heightCm: cartItems.reduce((sum, item) => sum + Number(item.height_cm) * item.quantity, 0),
    };

    try {
      const response = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationPostalCode: postalCode, parcel }),
      });
      const payload = (await response.json()) as {
        quotes?: ShippingQuote[];
        unavailable?: Array<{ provider: string; reason: string }>;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'No se pudo calcular el envío.');

      const quotes = payload.quotes || [];
      setShippingQuotes(quotes);
      if (quotes.length) setSelectedShipping(quotes[0]);
      const notices = (payload.unavailable || []).map((item) => `${item.provider}: ${item.reason}`);
      if (!quotes.length || notices.length) setShippingMessage(notices.join(' '));
    } catch (error) {
      setShippingMessage(error instanceof Error ? error.message : 'No se pudo calcular el envío.');
    } finally {
      setQuotingShipping(false);
    }
  };

  const checkoutByWhatsApp = async () => {
    if (cartItems.length === 0) return;

    setCheckoutMessage('');
    const requiredBuyerFields = [
      buyer.name,
      buyer.phone,
      buyer.email,
      buyer.address,
      buyer.locality,
      buyer.province,
      buyer.postalCode,
    ];
    if (requiredBuyerFields.some((value) => !value.trim())) {
      setCheckoutMessage('Completá todos los datos obligatorios del comprador.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())) {
      setCheckoutMessage('Ingresá un email válido.');
      return;
    }
    if (buyer.phone.replace(/\D/g, '').length < 8) {
      setCheckoutMessage('Ingresá un celular válido, con código de área.');
      return;
    }

    setSubmitting(true);

    if (isSupabaseConfigured && !hasDemoItems) {
      const orderItems = cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { data, error } = await supabase.rpc('create_order_with_items', {
        items: orderItems,
        payment_method: paymentMethod,
        order_source: 'web',
        buyer_name: buyer.name.trim(),
        buyer_phone: buyer.phone.trim(),
        buyer_email: buyer.email.trim().toLowerCase(),
        buyer_address: buyer.address.trim(),
        buyer_locality: buyer.locality.trim(),
        buyer_province: buyer.province.trim(),
        buyer_postal_code: buyer.postalCode.trim().toUpperCase(),
        buyer_notes: buyer.notes.trim(),
        coupon_code: couponPercent > 0 ? couponCode : null,
      });

      if (error) {
        setCheckoutMessage(`No se pudo registrar la compra: ${error.message}`);
        setSubmitting(false);
        return;
      }

      const orderId = String(data);

      if (['mercado_pago', 'tarjeta_credito', 'tarjeta_debito'].includes(paymentMethod)) {
        try {
          const response = await fetch('/api/payments/mercadopago/preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          });
          const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
          if (!response.ok || !payload.checkoutUrl) {
            throw new Error(payload.error || 'No se pudo abrir Mercado Pago.');
          }
          window.location.assign(payload.checkoutUrl);
          return;
        } catch (error) {
          setCheckoutMessage(
            error instanceof Error
              ? `${error.message} Tu pedido quedó pendiente y no se realizó ningún cobro.`
              : 'No se pudo abrir Mercado Pago. No se realizó ningún cobro.'
          );
          setSubmitting(false);
          return;
        }
      }

      fetch('/api/notifications/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, event: 'created' }),
      }).catch(() => undefined);

      const lines = cartItems.map((item, index) => {
        const colorText = item.color ? ` | Color: ${item.color}` : '';
        return `${index + 1}. ${item.name}${colorText} | Cantidad: ${item.quantity} | Unit: ${formatItemPrice(item.price)} | Subtotal: ${formatItemPrice(item.price * item.quantity)}`;
      });

      const message =
        `Hola MotoSport Neuquén, ya hice el pedido ${orderId} desde la web.\n\n` +
        `${lines.join('\n')}\n\n` +
        `Forma de pago: ${paymentLabel(paymentMethod)}\n` +
        `${couponPercent > 0 ? `Cupón: ${couponCode} (${couponPercent}% OFF)\n` : ''}` +
        `Cliente: ${buyer.name.trim()} · ${buyer.phone.trim()}\n` +
        `Entrega: ${buyer.address.trim()}, ${buyer.locality.trim()}, ${buyer.province.trim()} (${buyer.postalCode.trim().toUpperCase()})\n` +
        `${selectedShipping ? `Envío: ${selectedShipping.provider} - ${selectedShipping.service} (${selectedShipping.deliveryType}) - ${formatARS(Math.round(selectedShipping.price))}\n` : 'Envío: a coordinar\n'}` +
        `Total: ${formatOrderTotal()}\n\n` +
        `Quedo atento/a para coordinar.`;

      const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      clearCart();
      setCheckoutMessage(`Pedido ${orderId} registrado y stock descontado correctamente.`);
      setSubmitting(false);
      return;
    }

    const lines = cartItems.map((item, index) => {
      const colorText = item.color ? ` | Color: ${item.color}` : '';
      return `${index + 1}. ${item.name}${colorText} | Cantidad: ${item.quantity} | Unit: ${formatItemPrice(item.price)} | Subtotal: ${formatItemPrice(item.price * item.quantity)}`;
    });

    const message =
      `Hola MotoSport Neuquén, quiero comprar estos productos:\n\n` +
      `${lines.join('\n')}\n\n` +
      `Forma de pago: ${paymentLabel(paymentMethod)}\n` +
      `${couponPercent > 0 ? `Cupón: ${couponCode} (${couponPercent}% OFF)\n` : ''}` +
      `Cliente: ${buyer.name.trim()} · ${buyer.phone.trim()} · ${buyer.email.trim()}\n` +
      `Entrega: ${buyer.address.trim()}, ${buyer.locality.trim()}, ${buyer.province.trim()} (${buyer.postalCode.trim().toUpperCase()})\n` +
      `${buyer.notes.trim() ? `Observaciones: ${buyer.notes.trim()}\n` : ''}` +
      `${selectedShipping ? `Envío: ${selectedShipping.provider} - ${selectedShipping.service} (${selectedShipping.deliveryType}) - ${formatARS(Math.round(selectedShipping.price))}\n` : 'Envío: a coordinar\n'}` +
      `Total: ${formatOrderTotal()}\n\n` +
      `Quedo atento/a para coordinar.`;

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSubmitting(false);
  };

  return (
    <section className="container py-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Finalizá tu compra</p>
      <h1 className="mt-2 text-3xl font-black uppercase text-white sm:text-4xl">Tu bolsa</h1>

      {cartItems.length === 0 ? (
        <div className="bg-black/55 backdrop-blur-sm p-8 rounded-lg border border-primary/30 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-300 text-lg mb-6">Tu bolsa está vacía.</p>
          <Link
            to="/products"
          className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-white hover:text-black transition-colors btn-hover-scale btn-hover-shadow"
          >
            Seguir comprando
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <aside className="order-first space-y-3 lg:sticky lg:top-36 lg:order-2">
            <div className="rounded-xl border border-white/10 bg-[#101010] px-4 py-3">
              <h2 className="font-black uppercase tracking-wide text-white">Resumen de tu bolsa</h2>
              <p className="mt-1 text-xs text-white/35">{totalItemCount} {totalItemCount === 1 ? 'producto' : 'productos'}</p>
            </div>
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-lg border border-primary/30 bg-black/55 p-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-4"
              >
                <div className="flex min-w-0 items-center">
                  <img src={item.image} alt={item.name} className="mr-3 h-20 w-20 shrink-0 rounded-md object-cover sm:mr-4 sm:h-16 sm:w-16" />
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold text-white sm:text-lg">{item.name}</h2>
                    <p className="text-gray-300">{formatItemPrice(item.price)}</p>
                    {item.color ? <p className="text-sm text-gray-200">Color: {item.color}</p> : null}
                    <div className="flex items-center mt-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        aria-label={`Restar una unidad de ${item.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-l-md bg-gray-800 hover:bg-gray-700"
                      >
                        <Minus className="h-4 w-4 text-gray-300" />
                      </button>
                      <span className="flex h-9 min-w-9 items-center justify-center bg-gray-800 px-2 text-gray-200">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        aria-label={`Agregar una unidad de ${item.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-r-md bg-gray-800 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-4 w-4 text-gray-300" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between sm:w-auto sm:flex-col sm:items-end">
                  <p className="font-semibold text-white mb-2">{formatItemPrice(item.price * item.quantity)}</p>
                  <button type="button" onClick={() => removeItem(item.id)} aria-label={`Quitar ${item.name} de la bolsa`} className="flex h-11 w-11 items-center justify-center text-purple-400 transition-colors hover:text-gray-300">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-white/10 bg-[#101010] p-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4 text-white/55">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">{hasPendingPrices ? formatOrderTotal() : formatARS(Math.round(subtotal))}</span>
                </div>
                <div className="flex justify-between gap-4 text-white/55">
                  <span>Envío</span>
                  <span className="font-bold text-white">{selectedShipping ? (shipping === 0 ? 'Gratis' : formatARS(Math.round(shipping))) : 'A coordinar'}</span>
                </div>
                {couponPercent > 0 ? (
                  <div className="flex justify-between gap-4 text-primary">
                    <span>Descuento ({couponPercent}%)</span>
                    <span className="font-black">-{formatARS(discount)}</span>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
                <span className="font-black text-white">Total</span>
                <span className="text-right text-2xl font-black text-white">{formatOrderTotal()}</span>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <label htmlFor="coupon-code-summary" className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/55">
                  <TicketPercent className="h-4 w-4 text-primary" /> Cupón de descuento
                </label>
                <div className="mt-3 flex gap-2">
                  <input
                    id="coupon-code-summary"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7));
                      setCouponPercent(0);
                      setCouponMessage('');
                    }}
                    placeholder="CÓDIGO"
                    maxLength={7}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 font-mono text-sm font-black uppercase tracking-wider text-white outline-none placeholder:text-white/25 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="rounded-lg border border-primary/40 px-3 text-xs font-black text-primary transition hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {validatingCoupon ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponMessage ? <p className={`mt-2 text-xs font-semibold ${couponPercent > 0 ? 'text-primary' : 'text-amber-300'}`}>{couponMessage}</p> : null}
              </div>
            </div>

            <div>
              <Link to="/products" className="inline-flex min-h-11 items-center text-white/55 transition hover:text-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Seguir comprando
              </Link>
            </div>
          </aside>

          <div className="rounded-xl border border-white/10 bg-[#101010] p-4 backdrop-blur-sm sm:p-6 lg:order-1 lg:p-8">
            <h2 className="mb-4 text-xl font-black text-white">Datos, entrega y pago</h2>
            {checkoutMessage ? (
              <div className="mb-4 rounded-lg border border-purple-800/70 bg-purple-950/30 p-3 text-sm text-purple-100">
                {checkoutMessage}
              </div>
            ) : null}

            <div className="mb-5 rounded-lg border border-white/15 bg-white/[0.03] p-4">
              <h3 className="font-bold text-white">Datos del comprador</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">Se guardan con el pedido para que el local pueda contactarte.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ['name', 'Nombre y apellido', 'Ej: Juan Pérez', 'text'],
                  ['phone', 'Celular', 'Ej: 299 5343094', 'tel'],
                  ['email', 'Email', 'Ej: juan@email.com', 'email'],
                  ['address', 'Dirección', 'Calle y número', 'text'],
                  ['locality', 'Localidad', 'Ej: Neuquén', 'text'],
                  ['province', 'Provincia', 'Ej: Neuquén', 'text'],
                  ['postalCode', 'Código postal', 'Ej: 8300', 'text'],
                ].map(([key, label, placeholder, type]) => (
                  <label key={key} className="block text-xs font-semibold text-gray-300">
                    {label} *
                    <input
                      type={type}
                      required
                      value={buyer[key as keyof BuyerData]}
                      onChange={(event) => {
                        const value = key === 'postalCode' ? event.target.value.toUpperCase() : event.target.value;
                        setBuyer((current) => ({ ...current, [key]: value }));
                        if (key === 'postalCode') setPostalCode(value);
                      }}
                      placeholder={placeholder}
                      className="mt-1.5 min-h-11 w-full rounded-md border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                    />
                  </label>
                ))}
                <label className="block text-xs font-semibold text-gray-300 sm:col-span-2">
                  Observaciones (opcional)
                  <textarea
                    value={buyer.notes}
                    onChange={(event) => setBuyer((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Indicaciones para el pedido o la entrega"
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-md border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary"
                  />
                </label>
              </div>
            </div>
            <div className="hidden">
              <label htmlFor="coupon-code" className="flex items-center gap-2 text-sm font-bold text-white">
                <TicketPercent className="h-4 w-4 text-primary" />
                ¿Tenés un cupón?
              </label>
              <div className="mt-3 flex gap-2">
                <input
                  id="coupon-code"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7));
                    setCouponPercent(0);
                    setCouponMessage('');
                  }}
                  placeholder="Ingresá el código"
                  maxLength={7}
                  className="min-w-0 flex-1 rounded-md border border-white/20 bg-black/60 px-3 py-2 font-mono font-black uppercase tracking-[0.12em] text-white outline-none placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-white/25 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="rounded-md bg-primary px-4 py-2 font-black text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {validatingCoupon ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponMessage ? <p className={`mt-2 text-xs font-semibold ${couponPercent > 0 ? 'text-primary' : 'text-amber-300'}`}>{couponMessage}</p> : null}
            </div>
            <div className="hidden">
              <div className="flex justify-between gap-4 text-gray-300">
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>{hasPendingPrices ? formatOrderTotal() : formatARS(Math.round(subtotal))}</span>
              </div>
              <div className="flex justify-between gap-4 text-gray-300">
                <span>Envio</span>
                <span>{selectedShipping ? formatARS(Math.round(shipping)) : 'A coordinar'}</span>
              </div>
              {couponPercent > 0 ? (
                <div className="flex justify-between gap-4 text-primary">
                  <span>Descuento ({couponPercent}%)</span>
                  <span>-{formatARS(discount)}</span>
                </div>
              ) : null}
              <div className="border-t border-gray-700 pt-2 mt-2">
                <div className="flex justify-between gap-4 text-lg font-semibold text-white">
                  <span>Total</span>
                  <span className="text-right text-white">{formatOrderTotal()}</span>
                </div>
              </div>
            </div>

            <fieldset className="mb-5">
              <legend className="mb-3 text-sm font-black uppercase tracking-wider text-white">Elegí cómo querés pagar</legend>
              <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                {paymentOptions.map(({ value, label, hint, icon: Icon }) => {
                  const selected = paymentMethod === value;
                  const isMercadoPago = value === 'mercado_pago';
                  return (
                    <label
                      key={value}
                      className={`flex min-h-20 cursor-pointer items-center gap-4 px-2 py-4 transition ${
                        selected
                          ? 'bg-primary/[0.04] text-white'
                          : 'text-white/65 hover:bg-white/[0.025]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={value}
                        checked={selected}
                        onChange={() => setPaymentMethod(value)}
                        className="sr-only"
                      />
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${
                        selected ? 'border-primary' : 'border-white/15'
                      } ${isMercadoPago ? 'bg-black' : selected ? 'bg-primary text-black' : 'bg-black text-white/55'}`}>
                        {isMercadoPago ? (
                          <img
                            src="/branding/mercado-pago-logo.png"
                            alt=""
                            className="h-[74px] w-[111px] max-w-none -translate-x-[34px] -translate-y-[15px]"
                          />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-black">{label}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-white/40">{hint}</span>
                      </span>
                      {selected ? <Check className="h-5 w-5 shrink-0 text-primary" /> : <ChevronRight className="h-5 w-5 shrink-0 text-white/25" />}
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Mercado Pago procesa de forma segura los pagos con tarjeta. La tienda no solicita ni almacena los datos de tu tarjeta.
              </p>
            </fieldset>

            <button
              type="button"
              onClick={checkoutByWhatsApp}
              disabled={submitting}
              className={`flex min-h-14 w-full items-center justify-center rounded-xl px-6 py-3 font-black uppercase tracking-wide text-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                ['mercado_pago', 'tarjeta_credito', 'tarjeta_debito'].includes(paymentMethod)
                  ? 'bg-[#ffe600] hover:bg-[#ffed4a]'
                  : 'bg-primary hover:bg-lime-300'
              }`}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {submitting
                ? 'Procesando compra...'
                : ['mercado_pago', 'tarjeta_credito', 'tarjeta_debito'].includes(paymentMethod)
                  ? 'Continuar a Mercado Pago'
                  : 'Realizar pedido'}
            </button>

            <button
              type="button"
              onClick={clearCart}
              className="mt-3 flex w-full items-center justify-center px-6 py-3 text-xs font-bold text-white/35 transition hover:text-red-300"
            >
              Vaciar bolsa
            </button>
          </div>
          </div>
        </>
      )}
      </div>
    </section>
  );
}
