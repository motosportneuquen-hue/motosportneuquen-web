import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatProductPrice } from '../lib/currency';
import { useCartStore } from '../store/cartStore';
import { CartState } from '../types/cart';
import { Product } from '../types/supabase';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

const ProductCard = memo(function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const cartItems = useCartStore((state: CartState) => state.items);
  const [isInCart, setIsInCart] = useState(false);
  const navigate = useNavigate();
  const isOnRequest = product.price <= 0;

  useEffect(() => {
    setIsInCart(cartItems.some((item: { product_id: string }) => item.product_id === product.id));
  }, [cartItems, product.id]);

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOnRequest) {
      const message = `Hola MotoSport Neuquén, quiero consultar por ${product.name}. Modelo de moto: _____.`;
      window.open(`https://wa.me/5403534099785?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    const existingItem = cartItems.find((item: { product_id: string }) => item.product_id === product.id);
    if (existingItem) {
      useCartStore.getState().updateQuantity(existingItem.id, existingItem.quantity + 1);
      return;
    }
    onAddToCart(product);
  };

  const openProductDetail = () => navigate(`/products/${product.id}`);

  return (
    <article
      onClick={openProductDetail}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          openProductDetail();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Ver detalle de ${product.name}`}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] transition duration-300 hover:-translate-y-1 hover:border-white/25"
    >
      <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
        <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
        <span className="absolute left-4 top-4 rounded-full bg-black/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">{product.category}</span>
        {!isOnRequest && product.stock > 0 && product.stock <= 5 && <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_#55e600]" title={`Quedan ${product.stock}`} />}
        {!isOnRequest && product.stock === 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/55"><span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-black">Sin stock</span></div>}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-black leading-tight text-white">{product.name}</h3>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-white/25 transition group-hover:text-primary" />
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/45">{product.description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <p className="text-2xl font-black text-white">{isOnRequest ? 'Consultar' : formatProductPrice(Math.round(product.price))}</p>
          <button
            onClick={handleAddToCart}
            disabled={!isOnRequest && product.stock === 0}
            aria-label={isOnRequest ? 'Consultar por WhatsApp' : isInCart ? 'Agregar otra unidad' : 'Agregar al carrito'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
});

export default ProductCard;
