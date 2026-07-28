import { Product } from '../types/supabase';

const image = (label: string) =>
  `https://placehold.co/900x900/f3f3f3/151515?text=${encodeURIComponent(label)}`;

export const demoProducts: Product[] = [
  ['Casco integral Street Pro', 'Cascos e indumentaria', '110cc', 189900, 8, 'Casco integral liviano con visor transparente.'],
  ['Cubierta 90/90-18 urbana', 'Cubiertas y cámaras', 'CG / Titan / S2', 86500, 6, 'Cubierta urbana de uso diario con buen agarre.'],
  ['Kit transmisión reforzado', 'Repuestos', 'CG / Titan / S2', 118000, 5, 'Corona, piñón y cadena para renovación completa.'],
  ['Guantes Rider negros', 'Cascos e indumentaria', 'Rouser', 42900, 12, 'Guantes con protección y ajuste regulable.'],
  ['Pastillas de freno delanteras', 'Repuestos', 'Tornado / XR', 28900, 14, 'Compuesto de frenado para uso urbano y mixto.'],
  ['Espejos deportivos universales', 'Accesorios', 'Motomel / Corven / Zanella', 57900, 9, 'Par de espejos compactos con brazo regulable.'],
  ['Pedalines aluminio verde', 'Accesorios', 'Tornado / XR', 97600, 4, 'Pedalines anchos de aluminio con mejor apoyo.'],
  ['Faro LED redondo 7 pulgadas', 'Accesorios', 'Skua', 74900, 7, 'Iluminación LED blanca de bajo consumo.'],
  ['Cubre puños térmicos', 'Accesorios', 'Rouser', 65900, 10, 'Protección para las manos en días fríos.'],
  ['Filtro de aire alto flujo', 'Repuestos', 'Twister', 39700, 11, 'Filtro lavable para mantenimiento periódico.'],
  ['Baúl trasero 45 litros', 'Accesorios', 'Wave / Biz', 159900, 3, 'Baúl rígido con espacio para casco y objetos personales.'],
  ['Cámara reforzada 18 pulgadas', 'Cubiertas y cámaras', 'Motomel / Corven / Zanella', 24900, 16, 'Cámara reforzada para rueda de 18 pulgadas.'],
].map(([name, category, motorcycleModel, price, stock, description], index) => ({
  id: `demo-${index + 1}`,
  name: String(name),
  description: `${String(description)} Producto de muestra visual.`,
  price: Number(price),
  image_url: image(String(name)),
  category: String(category),
  motorcycle_model: String(motorcycleModel),
  stock: Number(stock),
  is_best_seller: index < 4,
  created_at: new Date(2026, 6, 28 - index).toISOString(),
  weight_grams: 1000,
  length_cm: 30,
  width_cm: 25,
  height_cm: 20,
}));
