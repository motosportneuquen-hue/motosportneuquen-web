import { create } from 'zustand';
import { CartItem, Product } from '../types/supabase';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, color?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (product, color) =>
    set((state) => {
      const cartItemId = color ? `${product.id}::${color}` : product.id;
      const existingItem = state.items.find((item) => item.id === cartItemId);
      if (existingItem) {
        const nextQuantity = Math.min(existingItem.quantity + 1, existingItem.stock);
        return {
          items: state.items.map((item) =>
            item.id === cartItemId
              ? { ...item, quantity: nextQuantity }
              : item
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: cartItemId,
            product_id: product.id,
            name: product.name,
            price: product.price,
            transfer_price: product.transfer_price,
            image: product.image_url,
            quantity: 1,
            stock: product.stock,
            color,
            weight_grams: product.weight_grams,
            length_cm: product.length_cm,
            width_cm: product.width_cm,
            height_cm: product.height_cm,
            free_shipping: Boolean(product.free_shipping),
          } as CartItem,
        ],
      };
    }),
  removeItem: (cartItemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== cartItemId),
    })),
  updateQuantity: (cartItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((item) => item.id !== cartItemId),
        };
      }
      const targetItem = state.items.find((item) => item.id === cartItemId);
      if (!targetItem) {
        return state;
      }
      const safeQuantity = Math.min(quantity, targetItem.stock);
      return {
        items: state.items.map((item) =>
          item.id === cartItemId ? { ...item, quantity: safeQuantity } : item
        ),
      };
    }),
  clearCart: () => set({ items: [] }),
}));


