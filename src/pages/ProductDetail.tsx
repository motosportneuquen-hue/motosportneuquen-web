import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, ArrowLeft, Info, Package, Truck, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import { Product, Review } from '../types/supabase';
import ProductGallery from '../components/ProductGallery';
import { formatProductPrice } from '../lib/currency';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setResenas] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProductos, setRelatedProductos] = useState<Product[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('Negro');
  
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const isOnRequest = product ? product.price <= 0 : false;

  useEffect(() => {
    async function fetchProductAndResenas() {
      setLoading(true);
      if (!id) return;

      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) {
        console.error('Error fetching product:', productError);
      } else if (productData) {
        setProduct(productData);
        
        // Fetch reviews for this product
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id,
            product_id,
            user_id,
            rating,
            comment,
            created_at
          `)
          .eq('product_id', id)
          .order('created_at', { ascending: false });

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        } else {
          setResenas(reviewsData || []);
        }
        
        // Fetch related products in the same category
        if (productData.category) {
          const { data: relatedData, error: relatedError } = await supabase
            .from('products')
            .select('*')
            .eq('category', productData.category)
            .neq('id', id)
            .limit(7); // Increased from 4 to 7 related products
            
          if (relatedError) {
            console.error('Error fetching related products:', relatedError);
          } else {
            setRelatedProductos(relatedData || []);
          }
        }
      }
      
      setLoading(false);
    }

    fetchProductAndResenas();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const colors = product.colors && product.colors.length > 0
      ? product.colors
      : ['Negro', 'Blanco', 'Gris'];
    setSelectedColor(colors[0]);
  }, [product]);

  // Check if the product is in the cart and update quantity accordingly
  useEffect(() => {
    if (product) {
      const cartItemId = selectedColor ? `${product.id}::${selectedColor}` : product.id;
      const cartItem = cartItems.find(item => item.id === cartItemId);
      if (cartItem) {
        setQuantity(cartItem.quantity);
        setAddedToCart(true);
      } else {
        setQuantity(1);
        setAddedToCart(false);
      }
    }
  }, [cartItems, product, selectedColor]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.price <= 0) {
      const message = `Hola MotoSport Neuquén, quiero consultar por ${product.name}. Modelo de moto: _____. Color: ${selectedColor || '_____'}.`;
      window.open(`https://wa.me/5492995343094?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    const cartItemId = selectedColor ? `${product.id}::${selectedColor}` : product.id;
    
    if (addedToCart) {
      // If already in cart, update quantity directly
      updateQuantity(cartItemId, quantity);
    } else {
      // If not in cart, add it once and then update quantity if needed
      addItem(product, selectedColor);
      
      // If quantity is more than 1, update the quantity
      if (quantity > 1) {
        updateQuantity(cartItemId, quantity);
      }
    }
    setAddedToCart(true);
  };

  const handleQuantityChange = (newCantidad: number) => {
    setQuantity(newCantidad);
  };

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-10">
        <p className="text-gray-600 dark:text-gray-300">Producto no encontrado.</p>
        <Link to="/products" className="text-primary hover:underline mt-4 inline-block">
          <ArrowLeft className="inline mr-2 h-4 w-4" />
          Volver a productos
        </Link>
      </div>
    );
  }

  const availableColors = product.colors && product.colors.length > 0
    ? product.colors
    : ['Negro', 'Blanco', 'Gris'];

  return (
    <div className="container py-6 sm:py-10">
      <Link to="/products" className="text-primary hover:underline mb-6 inline-block link-hover">
        <ArrowLeft className="inline mr-2 h-4 w-4" />
        Volver a productos
      </Link>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
        {/* Product Image Gallery */}
        <ProductGallery 
          productId={product.id} 
          mainImage={product.image_url} 
          selectedColor={selectedColor}
        />
        
        {/* Product Details */}
        <div>
          <h1 className="break-words text-2xl font-bold text-white sm:text-3xl">
            {product.name}
          </h1>
          
          <div className="flex items-center mb-4">
            {/* Average Rating */}
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= (reviews.reduce((acc, review) => acc + review.rating, 0) / Math.max(reviews.length, 1))
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">
              ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>
          
          <p className="mb-4 break-words text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.35)] sm:text-3xl">
            {formatProductPrice(Math.round(product.price))}
          </p>
          
          <div className="mb-6">
            <p className="text-gray-200 mb-2">
              <span className="font-semibold">Categoria:</span> {product.category}
            </p>
            <div className="mb-2">
              <span className="font-semibold text-gray-200">Color:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                      selectedColor === color
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-500 text-gray-200'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-gray-200 mb-2">
              <span className="font-semibold">Disponibilidad:</span>{' '}
              {isOnRequest ? (
                <span className="text-green-600 dark:text-green-400">Consultar disponibilidad</span>
              ) : product.stock > 0 ? (
                <span className="text-green-600 dark:text-green-400">En stock ({product.stock} disponibles)</span>
              ) : (
                <span className="text-purple-600 dark:text-purple-400">Sin stock</span>
              )}
            </p>
          </div>
          
          {/* Quantity Selector */}
          {!isOnRequest && <div className="flex items-center mb-6">
            <label htmlFor="quantity" className="mr-4 text-gray-200">
              Cantidad:
            </label>
            <div className="flex items-center border border-white/40 rounded-md">
              <button
                onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                className="px-3 py-1 text-gray-200 hover:bg-white/15"
              >
                -
              </button>
              <span className="px-4 py-1 text-white">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(Math.min(product.stock, quantity + 1))}
                className="px-3 py-1 text-gray-200 hover:bg-white/15"
              >
                +
              </button>
            </div>
          </div>}
          
          {/* Agregar al carrito Button */}
          <button
            onClick={handleAddToCart}
            disabled={!isOnRequest && product.stock === 0}
            className={`w-full flex items-center justify-center space-x-2 py-3 rounded-md btn-hover-scale ${
              product.stock > 0 || isOnRequest
                ? 'bg-primary hover:bg-white hover:text-black text-white'
                : 'bg-gray-300 cursor-not-allowed text-gray-500'
            } transition-colors`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{isOnRequest ? 'Consultar por WhatsApp' : product.stock > 0 ? (addedToCart ? 'Actualizar bolsa' : 'Agregar a la bolsa') : 'Sin stock'}</span>
          </button>
          
          {/* Envio & Returns Info */}
          <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4">
            <div className="flex items-center">
              <Truck className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm text-gray-200">Envio a todo el pais</span>
            </div>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm text-gray-200">Empaque seguro</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm text-gray-200">Cambios y devoluciones</span>
            </div>
            <div className="flex items-center">
              <Info className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm text-gray-200">Satisfaccion garantizada</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Productos relacionados */}
      {relatedProductos.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Productos relacionados
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
            {relatedProductos.map((relatedProduct) => (
              <Link 
                key={relatedProduct.id} 
                to={`/products/${relatedProduct.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105 btn-hover-shadow"
              >
                <img
                  src={relatedProduct.image_url}
                  alt={relatedProduct.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-white font-extrabold mt-2">
                    {formatProductPrice(Math.round(relatedProduct.price))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

