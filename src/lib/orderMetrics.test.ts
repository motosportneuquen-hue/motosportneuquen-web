import { describe, expect, it } from 'vitest';
import { calculateOrderMetrics, MetricsOrder } from './orderMetrics';

const orders: MetricsOrder[] = [
  {
    status: 'delivered',
    total_price: 100000,
    created_at: '2026-07-10T12:00:00.000Z',
    order_items: [{ quantity: 2, products: { name: 'Escape' } }],
  },
  {
    status: 'pending',
    total_price: 50000,
    created_at: '2026-07-20T12:00:00.000Z',
    order_items: [{ quantity: 1, products: { name: 'Cubierta' } }],
  },
  {
    status: 'cancelled',
    total_price: 900000,
    created_at: '2026-07-22T12:00:00.000Z',
    order_items: [{ quantity: 20, products: { name: 'No contar' } }],
  },
];

describe('order metrics', () => {
  it('excludes cancelled orders and only counts delivered revenue as historical sales', () => {
    const metrics = calculateOrderMetrics(orders, [10, 3, 0], new Date('2026-07-28T12:00:00.000Z'));

    expect(metrics.totalRevenue).toBe(100000);
    expect(metrics.monthlyRevenue).toBe(150000);
    expect(metrics.averageTicket).toBe(75000);
    expect(metrics.monthlyOrders).toBe(2);
  });

  it('calculates stock alerts and top products', () => {
    const metrics = calculateOrderMetrics(orders, [10, 3, 0], new Date('2026-07-28T12:00:00.000Z'));

    expect(metrics.totalStock).toBe(13);
    expect(metrics.lowStock).toBe(2);
    expect(metrics.topProducts).toEqual([
      ['Escape', 2],
      ['Cubierta', 1],
    ]);
  });
});
