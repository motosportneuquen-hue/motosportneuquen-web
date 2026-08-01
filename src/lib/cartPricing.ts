import { CartItem } from '../types/supabase';

export function cartItemUnitPrice(item: CartItem, paymentMethod: string) {
  if (paymentMethod === 'transferencia' && Number(item.transfer_price) > 0) {
    return Number(item.transfer_price);
  }

  return Number(item.price);
}
