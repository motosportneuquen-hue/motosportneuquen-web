import { describe, expect, it } from 'vitest';
import { cartItemUnitPrice } from './cartPricing';
import { CartItem } from '../types/supabase';

const item = {
  id: 'item-1',
  product_id: 'product-1',
  name: 'Escape deportivo',
  price: 120000,
  transfer_price: 95000,
  stock: 2,
  image: '',
  quantity: 1,
} as CartItem;

describe('cartItemUnitPrice', () => {
  it('usa el precio especial solamente para transferencia', () => {
    expect(cartItemUnitPrice(item, 'transferencia')).toBe(95000);
    expect(cartItemUnitPrice(item, 'mercado_pago')).toBe(120000);
    expect(cartItemUnitPrice(item, 'efectivo')).toBe(120000);
  });

  it('usa el precio normal cuando no hay precio especial válido', () => {
    expect(cartItemUnitPrice({ ...item, transfer_price: null }, 'transferencia')).toBe(120000);
    expect(cartItemUnitPrice({ ...item, transfer_price: 0 }, 'transferencia')).toBe(120000);
  });
});
