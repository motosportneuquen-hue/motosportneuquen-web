import { useState, useEffect, memo } from 'react';
import { ChevronLeft, ChevronRight, X, ShoppingCart, Star, Plus, Minus } from 'lucide-react';
import { Product, ProductImage } from '../types/supabase';
import { useCartStore } from '../store/cartStore';
import { formatProductPrice } from '../lib/currency';
import { supabase } from '../lib/supabase';

interface QuickViewProps {
  product: Product;
  onClose: () => void;
}

const QuickView = memo(function QuickView({ product, onClose }: QuickViewProps) {
  const [quantity, setQuantity] = useState(1);
  const availableColors = product.colors && product.colors.length > 0
    ? product.colors
    : ['Negro', 'Blanco', 'Gris'];
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0]);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [isInCart, setIsInCart] = useState(false);
  const [images, setImages] = useState<string[]>([product.image_url]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isOnRequest = product.price <= 0;

  const currentImage = images[currentImageIndex] || product.image_url;

  useEffect(() => {
    const nextColors = product.colors && product.colors.length > 0
      ? product.colors
      : ['Negro', 'Blanco', 'Gris'];
    setSelectedColor(nextColors[0]);
  }, [product.colors, product.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadImages() {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true });

      if (!isMounted) return;

      if (error || !data || data.length === 0) {
        setImages([product.image_url]);
        setCurrentImageIndex(0);
        return;
      }

      const imageUrls = (data as ProductImage[]).map((image) => image.image_url);
      const mergedImages = imageUrls.includes(product.image_url) ? imageUrls : [product.image_url, ...imageUrls];
      setImages(mergedImages);
      setCurrentImageIndex(0);
    }

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [product.id, product.image_url]);

  const showPreviousImage = () => {
    setCurrentImageIndex((index) => (index - 1 + images.length) % images.length);
  };

  const showNextImage = () => {
    setCurrentImageIndex((index) => (index + 1) % images.length);
  };

  useEffect(() => {
    // Check if product is already in cart
    const cartItemId = selectedColor ? `${product.id}::${selectedColor}` : product.id;
    const cartItem = cartItems.find(item => item.id === cartItemId);
    if (cartItem) {
      setQuantity(cartItem.quantity);
      setIsInCart(true);
    } else {
      setQuantity(1);
      setIsInCart(false);
    }
  }, [product.id, cartItems, selectedColor]);

  const handleAddToCart = () => {
    if (isOnRequest) {
      const message = `Hola MotoSport Neuquén, quiero consultar por ${product.name}. Modelo de moto: _____. Color: ${selectedColor || '_____'}.`;
      window.open(`https://wa.me/5403534099785?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      onClose();
      return;
    }

    const cartItemId = selectedColor ? `${product.id}::${selectedColor}` : product.id;
    if (isInCart) {
      // If already in cart, update quantity
      updateQuantity(cartItemId, quantity);
    } else {
      // If not in cart, add it
      addItem(product, selectedColor);
      
      // If quantity is more than 1, update the quantity
      if (quantity > 1) {
        updateQuantity(`${product.id}::${selectedColor}`, quantity);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto transform-gpu animate-modal-enter">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <div className="relative flex min-h-80 items-center justify-center">
              <img
                src={currentImage}
                alt={product.name}
                className="h-80 w-full object-contain"
                loading="lazy"
                decoding="async"
              />
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white shadow-md transition-colors hover:bg-primary"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white shadow-md transition-colors hover:bg-primary"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/20 p-3">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                      currentImageIndex === index ? 'border-primary opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img src={image} alt={`Miniatura ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {product.name}
            </h2>
            
            <div className="flex items-center mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-5 w-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <span className="ml-2 text-gray-600 dark:text-gray-300">
                (24 reviews)
              </span>
            </div>
            
            <p className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] mb-4">
              {formatProductPrice(Math.round(product.price))}
            </p>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-4">
              {product.description}
            </p>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <span className="font-semibold">Color:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                      selectedColor === color
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <span className="font-semibold">Categoria:</span> {product.category}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <span className="font-semibold">Disponibilidad:</span>{' '}
                {product.stock > 0 ? (
                  <span className="text-green-600 dark:text-green-400">En stock ({product.stock} disponibles)</span>
                ) : (
                  <span className="text-purple-600 dark:text-purple-400">Sin stock</span>
                )}
              </p>
            </div>
            
            {!isOnRequest && <div className="flex items-center mb-6">
              <label htmlFor="quantity" className="mr-4 text-gray-700 dark:text-gray-300">
                Cantidad:
              </label>
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-1 text-gray-800 dark:text-gray-200">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>}
            
            <div className="mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={!isOnRequest && product.stock === 0}
                className={`w-full flex items-center justify-center space-x-2 py-3 rounded-md transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  product.stock > 0 || isOnRequest
                    ? 'bg-primary hover:bg-white hover:text-black text-white'
                    : 'bg-gray-300 cursor-not-allowed text-gray-500'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{isOnRequest ? 'Consultar por WhatsApp' : product.stock > 0 ? (isInCart ? 'Actualizar carrito' : 'Agregar al carrito') : 'Sin stock'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default QuickView;

