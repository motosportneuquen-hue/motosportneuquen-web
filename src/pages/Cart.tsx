import { useState } from 'react';
import { ShoppingCart, Trash2, ArrowLeft, Plus, Minus, Truck } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Link } from 'react-router-dom';
import { formatARS } from '../lib/currency';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type PaymentMethod = 'efectivo' | 'transferencia';
type ShippingQuote = {
  id: string;
  provider: string;
  service: string;
  deliveryType: string;
  price: number;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
};

const WHATSAPP_PHONE = '5403534099785';

function paymentLabel(method: PaymentMethod) {
  switch (method) {
    case 'efectivo':
      return 'Efectivo';
    case 'transferencia':
      return 'Transferencia';
    default:
      return method;
  }
}

export default function Cart() {
  const cartItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingQuote | null>(null);
  const [shippingMessage, setShippingMessage] = useState('');
  const [quotingShipping, setQuotingShipping] = useState(false);

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(cartItemId);
    } else {
      updateQuantity(cartItemId, newQuantity);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = selectedShipping?.price || 0;
  const total = subtotal + shipping;
  const hasPendingPrices = cartItems.some((item) => item.price <= 0);

  const formatItemPrice = (price: number) =>
    price > 0 ? formatARS(Math.round(price)) : 'Precio a confirmar';

  const formatOrderTotal = () => {
    if (!hasPendingPrices) return formatARS(Math.round(total));
    if (total <= 0) return 'Precio total a confirmar';
    return `${formatARS(Math.round(total))} + precios a confirmar`;
  };

  const quoteShipping = async () => {
    setQuotingShipping(true);
    setShippingMessage('');
    setShippingQuotes([]);
    setSelectedShipping(null);

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

    setSubmitting(true);
    setCheckoutMessage('');

    if (isSupabaseConfigured) {
      const orderItems = cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { data, error } = await supabase.rpc('create_order_with_items', {
        items: orderItems,
        payment_method: paymentMethod,
        order_source: 'web',
      });

      if (error) {
        setCheckoutMessage(`No se pudo registrar la compra: ${error.message}`);
        setSubmitting(false);
        return;
      }

      const orderId = String(data);

      const lines = cartItems.map((item, index) => {
        const colorText = item.color ? ` | Color: ${item.color}` : '';
        return `${index + 1}. ${item.name}${colorText} | Cantidad: ${item.quantity} | Unit: ${formatItemPrice(item.price)} | Subtotal: ${formatItemPrice(item.price * item.quantity)}`;
      });

      const message =
        `Hola MotoSport Neuquén, ya hice el pedido ${orderId} desde la web.\n\n` +
        `${lines.join('\n')}\n\n` +
        `Forma de pago: ${paymentLabel(paymentMethod)}\n` +
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
      `${selectedShipping ? `Envío: ${selectedShipping.provider} - ${selectedShipping.service} (${selectedShipping.deliveryType}) - ${formatARS(Math.round(selectedShipping.price))}\n` : 'Envío: a coordinar\n'}` +
      `Total: ${formatOrderTotal()}\n\n` +
      `Quedo atento/a para coordinar.`;

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSubmitting(false);
  };

  return (
    <section className="container py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold text-white sm:text-3xl">Tu carrito</h1>

      {cartItems.length === 0 ? (
        <div className="bg-black/55 backdrop-blur-sm p-8 rounded-lg border border-primary/30 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-300 text-lg mb-6">Tu carrito esta vacio.</p>
          <Link
            to="/products"
          className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-white hover:text-black transition-colors btn-hover-scale btn-hover-shadow"
          >
            Seguir comprando
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-4 lg:col-span-2">
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
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-l-md bg-gray-800 hover:bg-gray-700"
                      >
                        <Minus className="h-4 w-4 text-gray-300" />
                      </button>
                      <span className="flex h-9 min-w-9 items-center justify-center bg-gray-800 px-2 text-gray-200">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
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
                  <button onClick={() => removeItem(item.id)} aria-label={`Quitar ${item.name} del carrito`} className="flex h-11 w-11 items-center justify-center text-purple-400 transition-colors hover:text-gray-300">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-6">
              <Link to="/products" className="inline-flex items-center text-white hover:text-gray-300 transition-colors link-hover">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Seguir comprando
              </Link>
            </div>
          </div>

          <div className="bg-black/55 backdrop-blur-sm p-6 rounded-lg border border-primary/30 h-fit">
            <h2 className="text-xl font-semibold text-white mb-4">Resumen del pedido</h2>
            {checkoutMessage ? (
              <div className="mb-4 rounded-lg border border-purple-800/70 bg-purple-950/30 p-3 text-sm text-purple-100">
                {checkoutMessage}
              </div>
            ) : null}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between gap-4 text-gray-300">
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>{hasPendingPrices ? formatOrderTotal() : formatARS(Math.round(subtotal))}</span>
              </div>
              <div className="flex justify-between gap-4 text-gray-300">
                <span>Envio</span>
                <span>{selectedShipping ? formatARS(Math.round(shipping)) : 'A calcular'}</span>
              </div>
              <div className="border-t border-gray-700 pt-2 mt-2">
                <div className="flex justify-between gap-4 text-lg font-semibold text-white">
                  <span>Total</span>
                  <span className="text-right text-white">{formatOrderTotal()}</span>
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-white/15 bg-white/[0.03] p-4">
              <label htmlFor="postal-code" className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Truck className="h-4 w-4 text-primary" />
                Calcular envío
              </label>
              <p className="mb-3 text-xs text-gray-400">Ingresá el código postal donde querés recibirlo.</p>
              <div className="flex gap-2">
                <input
                  id="postal-code"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value.toUpperCase())}
                  placeholder="Ej: 8300"
                  maxLength={8}
                  className="min-w-0 flex-1 rounded-md border border-white/25 bg-black/60 px-3 py-2 text-white outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={quoteShipping}
                  disabled={quotingShipping || !postalCode.trim()}
                  className="rounded-md bg-primary px-3 py-2 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {quotingShipping ? '...' : 'Calcular'}
                </button>
              </div>

              {shippingQuotes.length ? (
                <div className="mt-3 space-y-2">
                  {shippingQuotes.map((quote) => (
                    <label
                      key={quote.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-white/15 p-3 hover:border-primary/70"
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShipping?.id === quote.id}
                        onChange={() => setSelectedShipping(quote)}
                        className="mt-1 accent-[#56f000]"
                      />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block font-semibold text-white">{quote.provider} · {quote.deliveryType}</span>
                        <span className="block text-gray-400">
                          {quote.service}
                          {quote.deliveryDaysMin
                            ? ` · ${quote.deliveryDaysMin}${quote.deliveryDaysMax && quote.deliveryDaysMax !== quote.deliveryDaysMin ? ` a ${quote.deliveryDaysMax}` : ''} días`
                            : ''}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-white">{formatARS(Math.round(quote.price))}</span>
                    </label>
                  ))}
                </div>
              ) : null}
              {shippingMessage ? <p className="mt-3 text-xs text-amber-300">{shippingMessage}</p> : null}
            </div>

            <div className="mb-4">
              <label htmlFor="payment-method" className="block text-sm text-gray-300 mb-2">
                Forma de pago
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2 border border-white/30 rounded-md bg-black/60 text-white focus:border-white focus:ring-white"
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>

            <button
              onClick={checkoutByWhatsApp}
              disabled={submitting}
              className="w-full flex items-center justify-center bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors btn-hover-scale disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {submitting ? 'Procesando compra...' : 'Comprar por WhatsApp'}
            </button>

            <button
              onClick={clearCart}
              className="w-full mt-3 flex items-center justify-center bg-gray-800 text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Vaciar carrito
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
