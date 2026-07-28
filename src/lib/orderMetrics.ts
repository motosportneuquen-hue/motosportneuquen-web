export type MetricsOrder = {
  status: string;
  total_price: number;
  created_at: string;
  order_items?: Array<{
    quantity: number;
    products?: { name?: string } | null;
  }>;
};

export function calculateOrderMetrics(
  orders: MetricsOrder[],
  productStocks: number[],
  now = new Date()
) {
  const totalStock = productStocks.reduce((sum, stock) => sum + Number(stock || 0), 0);
  const lowStock = productStocks.filter((stock) => Number(stock || 0) <= 3).length;
  const validOrders = orders.filter((order) => order.status !== 'cancelled');
  const deliveredOrders = validOrders.filter((order) => order.status === 'delivered');
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const monthlyOrders = validOrders.filter((order) => {
    const date = new Date(order.created_at);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const averageTicket = validOrders.length
    ? validOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0) / validOrders.length
    : 0;
  const productSales = new Map<string, number>();

  validOrders.forEach((order) => {
    (order.order_items || []).forEach((item) => {
      const name = item.products?.name || 'Producto';
      productSales.set(name, (productSales.get(name) || 0) + item.quantity);
    });
  });

  return {
    totalStock,
    lowStock,
    totalRevenue,
    monthlyRevenue,
    averageTicket,
    monthlyOrders: monthlyOrders.length,
    topProducts: [...productSales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}
