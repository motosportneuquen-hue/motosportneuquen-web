import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCallback } from 'react';
import { BarChart3, Calculator, CheckCircle, Download, Edit, Mail, MapPin, PackageCheck, Phone, RefreshCw, Save, Search, TicketPercent, Trash2, Truck, Users } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Category, Offer, Product, ProductImage, Testimonial } from '../types/supabase';
import { formatARS } from '../lib/currency';
import { calculateOrderMetrics, calculateProfitability } from '../lib/orderMetrics';

type ProductForm = {
  id?: string;
  name: string;
  description: string;
  price: string;
  transfer_price: string;
  stock: string;
  category: string;
  motorcycle_model: string;
  image_url: string;
  colors: string;
  extra_images: string;
  is_best_seller: boolean;
  weight_grams: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
};

type CategoryForm = {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  activo: boolean;
  orden: string;
};

type DebtorForm = {
  id?: string;
  debtor_name: string;
  amount_due: string;
  product_name: string;
  phone: string;
  dni: string;
  due_date: string;
};

type TestimonialForm = {
  id?: string;
  nombre: string;
  mensaje: string;
  foto_url: string;
  activo: boolean;
  orden: string;
};

type AdminCategory = Category & {
  activo?: boolean;
  orden?: number;
};

type AdminDebtor = {
  id: string;
  debtor_name: string;
  phone?: string | null;
  dni?: string | null;
  product_name: string;
  amount_due: number;
  due_date?: string | null;
  paid_at?: string | null;
  status?: string | null;
  created_at: string;
};

type AdminMotorcycleModel = {
  id: string;
  name: string;
  activo: boolean;
  orden: number;
  created_at: string;
};

type AdminOffer = Offer & {
  products?: Product;
};

type AdminOrderItem = {
  id: string;
  quantity: number;
  price: number;
  cost_price?: number | null;
  products?: { name?: string; cost_price?: number | null } | null;
};

type AdminOrder = {
  id: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method?: string | null;
  coupon_code?: string | null;
  discount_amount?: number | null;
  source?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  customer_locality?: string | null;
  customer_province?: string | null;
  customer_postal_code?: string | null;
  customer_notes?: string | null;
  shipping_provider?: string | null;
  shipping_service?: string | null;
  tracking_number?: string | null;
  admin_notes?: string | null;
  created_at: string;
  order_items?: AdminOrderItem[];
};

type AdminCustomer = {
  key: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  locality: string;
  province: string;
  postalCode: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

type AdminCoupon = {
  id: string;
  code: string;
  discount_percent: number;
  active: boolean;
  created_at: string;
};

type CouponForm = {
  id?: string;
  code: string;
  discountPercent: string;
  active: boolean;
};

type ProductImageInput = {
  image_url: string;
  color: string | null;
};

const emptyProduct: ProductForm = {
  name: '',
  description: '',
  price: '',
  transfer_price: '',
  stock: '1',
  category: '',
  motorcycle_model: '',
  image_url: '',
  colors: 'Negro, Blanco, Gris',
  extra_images: '',
  is_best_seller: false,
  weight_grams: '500',
  length_cm: '20',
  width_cm: '15',
  height_cm: '10',
};

const emptyDebtor: DebtorForm = {
  debtor_name: '',
  amount_due: '',
  product_name: '',
  phone: '',
  dni: '',
  due_date: '',
};

const emptyTestimonial: TestimonialForm = {
  nombre: '',
  mensaje: '',
  foto_url: '',
  activo: true,
  orden: '0',
};

const emptyCategory: CategoryForm = {
  name: '',
  description: '',
  image_url: '',
  activo: true,
  orden: '0',
};

const emptyCoupon: CouponForm = {
  code: '',
  discountPercent: '10',
  active: true,
};

function generateCouponCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint32Array(7));
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
}

const fieldClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-primary/60 focus:bg-white/[0.055]';
const labelClass = 'block text-xs font-bold uppercase tracking-[0.08em] text-white/60';
const panelClass = 'rounded-xl border border-white/[0.08] bg-[#111] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)]';
const sharedBrandImage = '/branding/motosport-neuquen-logo.png';
const defaultMotorcycleModels = ['110cc', 'CG / Titan / S2', 'Tornado / XR', 'Skua', 'Rouser', 'Twister', 'Wave / Biz', 'Motomel / Corven / Zanella'];
const orderStatuses = [
  ['pending', 'Pendiente'],
  ['confirmed', 'Confirmado'],
  ['preparing', 'Preparando'],
  ['shipped', 'Enviado'],
  ['delivered', 'Entregado'],
  ['cancelled', 'Cancelado'],
] as const;

function adminPaymentLabel(method?: string | null) {
  const labels: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    mercado_pago: 'Mercado Pago',
    tarjeta_credito: 'Tarjeta de crédito',
    tarjeta_debito: 'Tarjeta de débito',
  };
  return method ? labels[method] || method : 'Pago a coordinar';
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractImageUrl(value: string) {
  return value.match(/(https?:\/\/\S+|\/\S+)/i)?.[1]?.trim() || value.trim();
}

function parseProductImageInput(value: string): ProductImageInput[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const imageUrl = extractImageUrl(line);
      const urlIndex = line.indexOf(imageUrl);
      const color = urlIndex > 0
        ? line.slice(0, urlIndex).replace(/[-|:]\s*$/, '').trim()
        : '';

      if (color) {
        return {
          color,
          image_url: imageUrl,
        };
      }

      return {
        color: null,
        image_url: imageUrl,
      };
    });
}

function formatProductImageInput(image: ProductImage) {
  return image.color ? `${image.color} - ${image.image_url}` : image.image_url;
}

function normalizeMatch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export default function CustomPanel() {
  const { user, profile, loading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'metrics' | 'costs' | 'customers' | 'coupons' | 'products' | 'categories' | 'models' | 'offers' | 'testimonials' | 'debtors' | 'orders'>('metrics');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [debtors, setDebtors] = useState<AdminDebtor[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [motorcycleModels, setMotorcycleModels] = useState<AdminMotorcycleModel[]>([]);
  const [modelName, setModelName] = useState('');
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [couponForm, setCouponForm] = useState<CouponForm>(emptyCoupon);
  const [offerProductId, setOfferProductId] = useState('');
  const [offerPercent, setOfferPercent] = useState('10');
  const [offerTitle, setOfferTitle] = useState('Oferta especial');
  const [offerProductSearch, setOfferProductSearch] = useState('');
  const [offerCategoryFilter, setOfferCategoryFilter] = useState('');
  const [productImages, setProductImages] = useState<Record<string, ProductImage[]>>({});
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [testimonialForm, setTestimonialForm] = useState<TestimonialForm>(emptyTestimonial);
  const [debtorForm, setDebtorForm] = useState<DebtorForm>(emptyDebtor);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [costProductSearch, setCostProductSearch] = useState('');
  const [costCategoryFilter, setCostCategoryFilter] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = Boolean(profile?.is_admin);

  const stats = useMemo(() => {
    return calculateOrderMetrics(orders, products.map((product) => Number(product.stock || 0)));
  }, [orders, products]);

  const profitability = useMemo(() => calculateProfitability(orders), [orders]);

  const customers = useMemo(() => {
    const grouped = new Map<string, AdminCustomer>();

    orders.forEach((order) => {
      const email = (order.customer_email || '').trim().toLowerCase();
      const phone = (order.customer_phone || '').trim();
      const phoneKey = phone.replace(/\D/g, '');
      if (!email && !phoneKey) return;
      const key = email || phoneKey;
      const existing = grouped.get(key);
      const isNewer = !existing || new Date(order.created_at).getTime() > new Date(existing.lastOrderAt).getTime();
      const countsAsPurchase = order.status !== 'cancelled';

      grouped.set(key, {
        key,
        name: isNewer ? order.customer_name || existing?.name || 'Cliente' : existing?.name || order.customer_name || 'Cliente',
        phone: isNewer ? phone || existing?.phone || '' : existing?.phone || phone,
        email: isNewer ? email || existing?.email || '' : existing?.email || email,
        address: isNewer ? order.customer_address || existing?.address || '' : existing?.address || order.customer_address || '',
        locality: isNewer ? order.customer_locality || existing?.locality || '' : existing?.locality || order.customer_locality || '',
        province: isNewer ? order.customer_province || existing?.province || '' : existing?.province || order.customer_province || '',
        postalCode: isNewer ? order.customer_postal_code || existing?.postalCode || '' : existing?.postalCode || order.customer_postal_code || '',
        orderCount: (existing?.orderCount || 0) + (countsAsPurchase ? 1 : 0),
        totalSpent: (existing?.totalSpent || 0) + (countsAsPurchase ? Number(order.total_price || 0) : 0),
        lastOrderAt: isNewer ? order.created_at : existing?.lastOrderAt || order.created_at,
      });
    });

    return [...grouped.values()]
      .filter((customer) => customer.orderCount > 0)
      .sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const search = normalizeMatch(customerSearch);
    if (!search) return customers;
    return customers.filter((customer) => normalizeMatch(
      `${customer.name} ${customer.phone} ${customer.email} ${customer.address} ${customer.locality} ${customer.province}`
    ).includes(search));
  }, [customerSearch, customers]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category, 'es', { sensitivity: 'base' });
      if (categoryCompare !== 0) return categoryCompare;
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = normalizeMatch(productSearch);
    if (!search) return sortedProducts;

    return sortedProducts.filter((product) =>
      normalizeMatch(`${product.name} ${product.category} ${product.motorcycle_model || ''} ${product.description || ''}`).includes(search)
    );
  }, [productSearch, sortedProducts]);

  const costCategoryOptions = useMemo(
    () => [...new Set(sortedProducts.map((product) => product.category).filter(Boolean))],
    [sortedProducts]
  );

  const filteredCostProducts = useMemo(() => {
    const search = normalizeMatch(costProductSearch);
    return sortedProducts.filter((product) => {
      const matchesCategory = !costCategoryFilter || product.category === costCategoryFilter;
      const matchesSearch = !search || normalizeMatch(
        `${product.name} ${product.category} ${product.motorcycle_model || ''}`
      ).includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [costCategoryFilter, costProductSearch, sortedProducts]);

  const offerProductOptions = useMemo(() => {
    const search = normalizeMatch(offerProductSearch);
    return sortedProducts.filter((product) => {
      const matchesPrice = product.price > 0;
      const matchesCategory = !offerCategoryFilter || product.category === offerCategoryFilter;
      const matchesSearch = !search || normalizeMatch(`${product.name} ${product.category} ${product.motorcycle_model || ''}`).includes(search);
      return matchesPrice && matchesCategory && matchesSearch;
    });
  }, [offerCategoryFilter, offerProductSearch, sortedProducts]);

  const pendingDebtors = useMemo(
    () => debtors.filter((debtor) => debtor.status !== 'paid' && !debtor.paid_at),
    [debtors]
  );

  const paidDebtors = useMemo(
    () => debtors.filter((debtor) => debtor.status === 'paid' || debtor.paid_at),
    [debtors]
  );

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderCompare = Number(a.orden || 0) - Number(b.orden || 0);
      if (orderCompare !== 0) return orderCompare;
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
  }, [categories]);

  const availableMotorcycleModels = useMemo(
    () => motorcycleModels.length > 0 ? motorcycleModels.map((model) => model.name) : defaultMotorcycleModels,
    [motorcycleModels]
  );

  const sortedTestimonials = useMemo(() => {
    return [...testimonials].sort((a, b) => {
      const orderCompare = Number(a.orden || 0) - Number(b.orden || 0);
      if (orderCompare !== 0) return orderCompare;
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
  }, [testimonials]);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;

    const [{ data: productData }, { data: categoryData }, { data: testimonialsData }, { data: imagesData }, { data: debtorsData }, { data: ordersData }, { data: modelsData }, { data: offersData }, { data: couponsData }] = await Promise.all([
      supabase.from('products').select('*').order('category', { ascending: true }).order('name', { ascending: true }),
      supabase.from('categories').select('*').order('orden', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('testimonials').select('*').order('orden', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('product_images').select('*').order('display_order', { ascending: true }),
      supabase.from('debtors').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*, order_items(id, quantity, price, cost_price, products(name, cost_price))').order('created_at', { ascending: false }),
      supabase.from('motorcycle_models').select('*').order('orden', { ascending: true }).order('name', { ascending: true }),
      supabase.from('offers').select('*, products(*)').order('orden', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    ]);

    setProducts((productData || []) as Product[]);
    setCategories((categoryData || []) as AdminCategory[]);
    setTestimonials((testimonialsData || []) as Testimonial[]);
    setDebtors((debtorsData || []) as AdminDebtor[]);
    setOrders((ordersData || []) as AdminOrder[]);
    setMotorcycleModels((modelsData || []) as AdminMotorcycleModel[]);
    setOffers((offersData || []) as AdminOffer[]);
    setCoupons((couponsData || []) as AdminCoupon[]);

    const groupedImages = ((imagesData || []) as ProductImage[]).reduce<Record<string, ProductImage[]>>((acc, image) => {
      acc[image.product_id] = [...(acc[image.product_id] || []), image];
      return acc;
    }, {});
    setProductImages(groupedImages);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: productForm.price.trim() === '' ? 0 : Number(productForm.price),
        transfer_price: productForm.transfer_price.trim() === '' ? null : Number(productForm.transfer_price),
        stock: Number(productForm.stock),
        category: productForm.category.trim(),
        motorcycle_model: productForm.motorcycle_model.trim() || null,
        image_url: extractImageUrl(productForm.image_url),
        colors: splitList(productForm.colors),
        is_best_seller: productForm.is_best_seller,
        weight_grams: Number(productForm.weight_grams),
        length_cm: Number(productForm.length_cm),
        width_cm: Number(productForm.width_cm),
        height_cm: Number(productForm.height_cm),
    };

    const request = productForm.id
      ? supabase.from('products').update(payload).eq('id', productForm.id).select().single()
      : supabase.from('products').insert(payload).select().single();

    const { data, error } = await request;
    if (error) {
      setMessage(`No se pudo guardar el producto: ${error.message}`);
      setSaving(false);
      return;
    }

    const productId = (data as Product).id;
    const images: ProductImageInput[] = [
      { image_url: payload.image_url, color: null },
      ...parseProductImageInput(productForm.extra_images),
    ].filter((image) => image.image_url);

    const { error: deleteImagesError } = await supabase.from('product_images').delete().eq('product_id', productId);
    if (deleteImagesError) {
      setMessage(`El producto se guardo, pero no se pudieron actualizar las imagenes: ${deleteImagesError.message}`);
      setSaving(false);
      return;
    }

    if (images.length > 0) {
      const { error: imagesError } = await supabase.from('product_images').insert(
        images.map((image, index) => ({
          product_id: productId,
          image_url: image.image_url,
          color: image.color,
          is_primary: index === 0,
          display_order: index + 1,
        }))
      );

      if (imagesError) {
        setMessage(`El producto se guardo, pero no se pudieron guardar las imagenes extra: ${imagesError.message}`);
        setSaving(false);
        return;
      }
    }

    setProductForm(emptyProduct);
    setMessage('Producto guardado correctamente.');
    setSaving(false);
    await loadData();
  };

  const editProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      price: String(product.price || ''),
      transfer_price: product.transfer_price == null ? '' : String(product.transfer_price),
      stock: String(product.stock || 0),
      category: product.category || '',
      motorcycle_model: product.motorcycle_model || '',
      image_url: product.image_url || '',
      colors: (product.colors || []).join(', '),
      is_best_seller: Boolean(product.is_best_seller),
      weight_grams: String(product.weight_grams || 500),
      length_cm: String(product.length_cm || 20),
      width_cm: String(product.width_cm || 15),
      height_cm: String(product.height_cm || 10),
      extra_images: (productImages[product.id] || [])
        .filter((image) => image.image_url !== product.image_url)
        .map(formatProductImageInput)
        .join('\n'),
    });
    setActiveTab('products');
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const nextOrder = categories.reduce((max, category) => Math.max(max, Number(category.orden || 0)), 0) + 1;

    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || null,
      image_url: sharedBrandImage,
      activo: categoryForm.activo,
      orden: categoryForm.id ? Number(categoryForm.orden || 0) : nextOrder,
    };

    const request = categoryForm.id
      ? supabase.from('categories').update(payload).eq('id', categoryForm.id)
      : supabase.from('categories').insert(payload);

    const { error } = await request;
    setMessage(error ? `No se pudo guardar la categoria: ${error.message}` : 'Categoria guardada correctamente.');
    if (!error) {
      setCategoryForm(emptyCategory);
    }
    setSaving(false);
    await loadData();
  };

  const editCategory = (category: AdminCategory) => {
    setCategoryForm({
      id: category.id,
      name: category.name || '',
      description: category.description || '',
      image_url: category.image_url || '',
      activo: Boolean(category.activo),
      orden: String(category.orden ?? 0),
    });
    setActiveTab('categories');
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Seguro que queres borrar esta categoria?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    setMessage(error ? `No se pudo borrar la categoria: ${error.message}` : 'Categoria eliminada.');
    await loadData();
  };

  const saveTestimonial = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const nextOrder = testimonials.reduce((max, testimonial) => Math.max(max, Number(testimonial.orden || 0)), 0) + 1;

    const payload = {
      nombre: testimonialForm.nombre.trim(),
      mensaje: testimonialForm.mensaje.trim(),
      foto_url: sharedBrandImage,
      activo: testimonialForm.activo,
      orden: testimonialForm.id ? Number(testimonialForm.orden || 0) : nextOrder,
    };

    const request = testimonialForm.id
      ? supabase.from('testimonials').update(payload).eq('id', testimonialForm.id)
      : supabase.from('testimonials').insert(payload);

    const { error } = await request;
    setMessage(error ? `No se pudo guardar la reseña: ${error.message}` : 'Reseña guardada correctamente.');
    if (!error) {
      setTestimonialForm(emptyTestimonial);
    }
    setSaving(false);
    await loadData();
  };

  const editTestimonial = (testimonial: Testimonial) => {
    setTestimonialForm({
      id: testimonial.id,
      nombre: testimonial.nombre || '',
      mensaje: testimonial.mensaje || '',
      foto_url: testimonial.foto_url || '',
      activo: Boolean(testimonial.activo),
      orden: String(testimonial.orden ?? 0),
    });
    setActiveTab('testimonials');
  };

  const deleteTestimonial = async (testimonialId: string) => {
    if (!confirm('Seguro que queres borrar esta reseña?')) return;
    const { error } = await supabase.from('testimonials').delete().eq('id', testimonialId);
    setMessage(error ? `No se pudo borrar la reseña: ${error.message}` : 'Reseña eliminada.');
    await loadData();
  };

  const uploadProductFiles = async (files: FileList | File[] | null, mode: 'main' | 'extra') => {
    const filesToUpload = files ? Array.from(files) : [];
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setMessage('');

    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
      const extension = file.name.split('.').pop() || file.type.split('/').pop() || 'jpg';
      const safeName = (file.name || `imagen-${Date.now()}`)
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filePath = `products/${Date.now()}-${safeName}.${extension}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: false });

      if (error) {
        setMessage(`No se pudo subir "${file.name}": ${error.message}`);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);
    }

    setProductForm((current) => {
      if (mode === 'main') {
        const [mainImage, ...restImages] = uploadedUrls;
        return {
          ...current,
          image_url: mainImage || current.image_url,
          extra_images: [...splitList(current.extra_images), ...restImages].join('\n'),
        };
      }

      return {
        ...current,
        extra_images: [...splitList(current.extra_images), ...uploadedUrls].join('\n'),
      };
    });

    setMessage('Imagenes subidas correctamente. Ahora toca Guardar producto.');
    setUploading(false);
  };

  const pasteProductImage = async (event: { clipboardData: DataTransfer; preventDefault: () => void }, mode: 'main' | 'extra') => {
    const imageFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    if (imageFiles.length === 0) return;

    event.preventDefault();
    await uploadProductFiles(imageFiles, mode);
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Seguro que queres borrar este producto?')) return;
    await supabase.from('product_images').delete().eq('product_id', productId);
    const { error } = await supabase.from('products').delete().eq('id', productId);
    setMessage(error ? `No se pudo borrar: ${error.message}` : 'Producto eliminado.');
    await loadData();
  };

  const saveDebtor = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      debtor_name: debtorForm.debtor_name.trim(),
      amount_due: Number(debtorForm.amount_due),
      product_name: debtorForm.product_name.trim(),
      phone: debtorForm.phone.trim() || null,
      dni: debtorForm.dni.trim() || null,
      due_date: debtorForm.due_date || null,
      status: 'pending',
      paid_at: null,
    };
    const request = debtorForm.id
      ? supabase.from('debtors').update(payload).eq('id', debtorForm.id)
      : supabase.from('debtors').insert(payload);
    const { error } = await request;
    setMessage(error ? `No se pudo guardar el deudor: ${error.message}` : 'Deudor guardado correctamente.');
    setDebtorForm(emptyDebtor);
    setSaving(false);
    await loadData();
  };

  const editDebtor = (debtor: AdminDebtor) => {
    setDebtorForm({
      id: debtor.id,
      debtor_name: debtor.debtor_name || '',
      amount_due: String(debtor.amount_due || ''),
      product_name: debtor.product_name || '',
      phone: debtor.phone || '',
      dni: debtor.dni || '',
      due_date: debtor.due_date || '',
    });
    setActiveTab('debtors');
  };

  const deleteDebtor = async (debtorId: string) => {
    if (!confirm('Seguro que queres borrar este deudor?')) return;
    const { error } = await supabase.from('debtors').delete().eq('id', debtorId);
    setMessage(error ? `No se pudo borrar: ${error.message}` : 'Deudor eliminado.');
    await loadData();
  };

  const markDebtorAsPaid = async (debtorId: string) => {
    const { error } = await supabase
      .from('debtors')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', debtorId);

    setMessage(error ? `No se pudo marcar como pagado: ${error.message}` : 'Deudor marcado como pagado.');
    await loadData();
  };

  const updateOrder = async (
    orderId: string,
    changes: Partial<Pick<AdminOrder, 'status' | 'shipping_provider' | 'shipping_service' | 'tracking_number' | 'admin_notes'>>
  ) => {
    setSaving(true);
    setMessage('');
    const { error } = await supabase
      .from('orders')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    setMessage(error ? `No se pudo actualizar el pedido: ${error.message}` : 'Pedido actualizado correctamente.');
    setSaving(false);
    if (!error) await loadData();
  };

  const updateProductCost = async (productId: string, value: string) => {
    const normalized = value.trim();
    const cost = normalized === '' ? null : Number(normalized);
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      setMessage('El costo debe ser un número mayor o igual a cero.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('products').update({ cost_price: cost }).eq('id', productId);
    setMessage(error ? `No se pudo guardar el costo: ${error.message}` : 'Costo actualizado correctamente.');
    setSaving(false);
    if (!error) await loadData();
  };

  const createMotorcycleModel = async (event: FormEvent) => {
    event.preventDefault();
    const name = modelName.trim();
    if (!name) return;
    setSaving(true);
    const nextOrder = motorcycleModels.reduce((max, model) => Math.max(max, Number(model.orden || 0)), 0) + 1;
    const { error } = await supabase.from('motorcycle_models').insert({ name, activo: true, orden: nextOrder });
    setMessage(error ? `No se pudo crear el modelo: ${error.message}` : 'Modelo agregado correctamente.');
    if (!error) setModelName('');
    setSaving(false);
    await loadData();
  };

  const updateMotorcycleModel = async (modelId: string, changes: Partial<Pick<AdminMotorcycleModel, 'name' | 'activo' | 'orden'>>) => {
    setSaving(true);
    const { error } = await supabase.from('motorcycle_models').update(changes).eq('id', modelId);
    setMessage(error ? `No se pudo actualizar el modelo: ${error.message}` : 'Modelo actualizado correctamente.');
    setSaving(false);
    if (!error) await loadData();
  };

  const deleteMotorcycleModel = async (modelId: string) => {
    if (!confirm('¿Seguro que querés borrar este modelo? Los productos existentes conservarán el texto del modelo.')) return;
    const { error } = await supabase.from('motorcycle_models').delete().eq('id', modelId);
    setMessage(error ? `No se pudo borrar el modelo: ${error.message}` : 'Modelo eliminado.');
    if (!error) await loadData();
  };

  const createOffer = async (event: FormEvent) => {
    event.preventDefault();
    const product = products.find((item) => item.id === offerProductId);
    const percent = Math.min(90, Math.max(1, Number(offerPercent)));
    if (!product || product.price <= 0) {
      setMessage('Elegí un producto con precio cargado.');
      return;
    }

    setSaving(true);
    const offerPrice = Math.round(product.price * (1 - percent / 100));
    const nextOrder = offers.reduce((max, offer) => Math.max(max, Number(offer.orden || 0)), 0) + 1;
    const { error } = await supabase.from('offers').insert({
      product_id: product.id,
      title: offerTitle.trim() || 'Oferta especial',
      badge: `${percent}% OFF`,
      offer_price: offerPrice,
      activo: true,
      orden: nextOrder,
    });
    setMessage(error ? `No se pudo crear la oferta: ${error.message}` : 'Oferta creada correctamente.');
    if (!error) {
      setOfferProductId('');
      setOfferPercent('10');
    }
    setSaving(false);
    await loadData();
  };

  const updateOffer = async (offerId: string, changes: Partial<Pick<AdminOffer, 'activo' | 'orden'>>) => {
    const { error } = await supabase.from('offers').update(changes).eq('id', offerId);
    setMessage(error ? `No se pudo actualizar la oferta: ${error.message}` : 'Oferta actualizada.');
    if (!error) await loadData();
  };

  const deleteOffer = async (offerId: string) => {
    if (!confirm('¿Seguro que querés eliminar esta oferta?')) return;
    const { error } = await supabase.from('offers').delete().eq('id', offerId);
    setMessage(error ? `No se pudo eliminar la oferta: ${error.message}` : 'Oferta eliminada.');
    if (!error) await loadData();
  };

  const saveCoupon = async (event: FormEvent) => {
    event.preventDefault();
    const code = couponForm.code.trim().toUpperCase();
    const percent = Number(couponForm.discountPercent);
    if (!/^[A-Z0-9]{7}$/.test(code)) {
      setMessage('El código debe tener exactamente 7 letras o números.');
      return;
    }
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) {
      setMessage('El descuento debe ser un porcentaje entero entre 1 y 90.');
      return;
    }

    setSaving(true);
    const payload = { code, discount_percent: percent, active: couponForm.active, updated_at: new Date().toISOString() };
    const request = couponForm.id
      ? supabase.from('coupons').update(payload).eq('id', couponForm.id)
      : supabase.from('coupons').insert(payload);
    const { error } = await request;
    setMessage(error ? `No se pudo guardar el cupón: ${error.message}` : 'Cupón guardado correctamente.');
    if (!error) setCouponForm(emptyCoupon);
    setSaving(false);
    if (!error) await loadData();
  };

  const editCoupon = (coupon: AdminCoupon) => {
    setCouponForm({
      id: coupon.id,
      code: coupon.code,
      discountPercent: String(coupon.discount_percent),
      active: coupon.active,
    });
    setActiveTab('coupons');
  };

  const toggleCoupon = async (coupon: AdminCoupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ active: !coupon.active, updated_at: new Date().toISOString() })
      .eq('id', coupon.id);
    setMessage(error ? `No se pudo actualizar el cupón: ${error.message}` : `Cupón ${coupon.active ? 'desactivado' : 'activado'}.`);
    if (!error) await loadData();
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('¿Seguro que querés eliminar este cupón?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', couponId);
    setMessage(error ? `No se pudo eliminar el cupón: ${error.message}` : 'Cupón eliminado.');
    if (!error && couponForm.id === couponId) setCouponForm(emptyCoupon);
    if (!error) await loadData();
  };

  const exportDebtorsCsv = () => {
    const rows = debtors.map((debtor) => ({
      estado: debtor.status === 'paid' || debtor.paid_at ? 'Pagado' : 'Pendiente',
      nombre: debtor.debtor_name,
      producto: debtor.product_name,
      debe: debtor.amount_due,
      celular: debtor.phone || '',
      dni: debtor.dni || '',
      fecha_pago_prometida: debtor.due_date || '',
      cargado: new Date(debtor.created_at).toLocaleDateString('es-AR'),
      pagado: debtor.paid_at ? new Date(debtor.paid_at).toLocaleDateString('es-AR') : '',
    }));

    const headers = Object.keys(rows[0] || {
      estado: '',
      nombre: '',
      producto: '',
      debe: '',
      celular: '',
      dni: '',
      fecha_pago_prometida: '',
      cargado: '',
      pagado: '',
    });

    const escapeCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCell(row[header as keyof typeof row])).join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deudores-speedy-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <section className="container py-10 text-gray-200">Cargando panel...</section>;
  }

  if (!user) {
    return (
      <section className="container py-10">
        <div className={panelClass}>
          <h1 className="font-brand text-3xl text-white">Panel administrador</h1>
          <p className="mt-3 text-gray-200">Tenes que iniciar sesion para administrar la tienda.</p>
          <Link to="/auth" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-2.5 font-bold text-black">
            Ingresar
          </Link>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="container py-10">
        <div className={panelClass}>
          <h1 className="font-brand text-3xl text-white">Panel administrador</h1>
          <p className="mt-3 text-gray-200">
            Tu usuario inicio sesion, pero todavia no esta marcado como administrador en Supabase.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Activa <code className="text-white">profiles.is_admin = true</code> para tu usuario.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container space-y-7 py-8 sm:py-12">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">MotoSport Neuquén</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Administración</h1>
          <p className="mt-2 text-sm text-white/45">Pedidos, productos y categorías en un solo lugar.</p>
        </div>
        <button onClick={loadData} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:border-primary/40">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={panelClass}><p className="text-xs font-bold uppercase tracking-wider text-white/40">Productos</p><p className="mt-2 text-3xl font-black text-white">{products.length}</p></div>
        <div className={panelClass}><p className="text-xs font-bold uppercase tracking-wider text-white/40">Pedidos activos</p><p className="mt-2 text-3xl font-black text-primary">{orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length}</p></div>
        <div className={panelClass}><p className="text-xs font-bold uppercase tracking-wider text-white/40">Unidades en stock</p><p className="mt-2 text-3xl font-black text-primary">{stats.totalStock}</p></div>
      </div>

      {message ? <div className="rounded-lg border border-primary/25 bg-primary/[0.06] p-3 text-sm text-white">{message}</div> : null}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#101010] p-1.5">
        {[
          ['metrics', 'Métricas'],
          ['costs', 'Costos y ganancias'],
          ['customers', 'Clientes'],
          ['orders', 'Pedidos'],
          ['coupons', 'Cupones'],
          ['offers', 'Ofertas'],
          ['products', 'Productos'],
          ['categories', 'Categorias'],
          ['models', 'Modelos de moto'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`min-h-10 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-black transition ${
              ['metrics', 'orders', 'products'].includes(id)
                ? activeTab === id
                  ? 'border-secondary bg-secondary text-white shadow-[0_0_18px_rgba(192,38,211,0.28)]'
                  : 'border-secondary/35 bg-secondary/10 text-fuchsia-300 hover:border-secondary/70 hover:bg-secondary/15 hover:text-white'
                : activeTab === id
                  ? 'border-primary bg-primary text-black'
                  : 'border-transparent text-white/55 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'costs' ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.045] p-4 text-sm text-white/65">
            <b className="text-white">Uso opcional.</b> Podés dejar cualquier costo vacío. Esto no afecta el catálogo, el stock ni las compras.
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Ventas analizadas', formatARS(Math.round(profitability.revenue)), 'Pedidos entregados'],
              ['Costo estimado', formatARS(Math.round(profitability.cost)), 'Según costos cargados'],
              ['Ganancia bruta', formatARS(Math.round(profitability.profit)), 'Venta menos costo'],
              ['Sin costo', String(profitability.itemsWithoutCost), 'Productos vendidos sin costo cargado'],
            ].map(([label, value, hint]) => (
              <div key={label} className={panelClass}>
                <p className="text-[11px] font-black uppercase tracking-wider text-white/40">{label}</p>
                <p className="mt-2 break-words text-2xl font-black text-primary">{value}</p>
                <p className="mt-1 text-xs text-white/35">{hint}</p>
              </div>
            ))}
          </div>

          <div className={panelClass}>
            <div className="flex flex-col gap-5 border-b border-white/[0.07] pb-5">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-black text-white">Costo por producto</h2>
                  <p className="mt-1 text-sm text-white/40">El margen se calcula sobre el precio actual de venta.</p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(220px,320px)_auto]">
                <label className="relative block">
                  <span className="sr-only">Buscar producto</span>
                  <input
                    type="search"
                    value={costProductSearch}
                    onChange={(event) => setCostProductSearch(event.target.value)}
                    placeholder="Buscar por producto o modelo"
                    className={`${fieldClass} mt-0 pr-11`}
                  />
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                </label>

                <label>
                  <span className="sr-only">Filtrar por categoría</span>
                  <select
                    value={costCategoryFilter}
                    onChange={(event) => setCostCategoryFilter(event.target.value)}
                    className={`${fieldClass} mt-0 cursor-pointer`}
                  >
                    <option value="">Todas las categorías</option>
                    {costCategoryOptions.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setCostProductSearch('');
                    setCostCategoryFilter('');
                  }}
                  disabled={!costProductSearch && !costCategoryFilter}
                  className="min-h-11 rounded-lg border border-white/10 px-4 text-sm font-bold text-white/55 transition hover:border-secondary/40 hover:text-white disabled:cursor-default disabled:opacity-30"
                >
                  Limpiar
                </button>
              </div>

              <p className="text-xs font-bold text-white/35">
                {filteredCostProducts.length} de {sortedProducts.length} productos
              </p>
            </div>
            <div className="mt-5 divide-y divide-white/[0.07]">
              {filteredCostProducts.map((product) => {
                const cost = product.cost_price == null ? null : Number(product.cost_price);
                const margin = cost == null ? null : Number(product.price || 0) - cost;
                const marginPercent = margin != null && product.price > 0 ? (margin / product.price) * 100 : null;
                return (
                  <form
                    key={product.id}
                    className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_150px_150px_150px_auto] md:items-end"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      updateProductCost(product.id, String(form.get('cost_price') || ''));
                    }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-white">{product.name}</p>
                      <p className="text-xs text-white/35">{product.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-white/35">Precio de venta</p>
                      <p className="mt-2 min-h-11 rounded-lg border border-white/[0.06] bg-black/30 px-3 py-3 text-sm font-bold text-white">{formatARS(Math.round(product.price || 0))}</p>
                    </div>
                    <label className={labelClass}>
                      Costo opcional
                      <input
                        name="cost_price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={cost ?? ''}
                        placeholder="Sin cargar"
                        className={fieldClass}
                      />
                    </label>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-white/35">Margen estimado</p>
                      <p className={`mt-2 min-h-11 rounded-lg border border-white/[0.06] bg-black/30 px-3 py-3 text-sm font-bold ${margin == null ? 'text-white/30' : margin >= 0 ? 'text-primary' : 'text-red-300'}`}>
                        {margin == null ? 'Sin calcular' : `${formatARS(Math.round(margin))}${marginPercent != null ? ` · ${marginPercent.toFixed(1)}%` : ''}`}
                      </p>
                    </div>
                    <button disabled={saving} className="min-h-11 rounded-lg bg-primary px-4 font-black text-black disabled:opacity-50">Guardar</button>
                  </form>
                );
              })}
              {filteredCostProducts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
                  <p className="font-black text-white">No encontramos productos</p>
                  <p className="mt-1 text-sm text-white/40">Probá con otra búsqueda o categoría.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'customers' ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={panelClass}><p className="text-xs font-black uppercase tracking-wider text-white/40">Clientes registrados</p><p className="mt-2 text-3xl font-black text-primary">{customers.length}</p></div>
            <div className={panelClass}><p className="text-xs font-black uppercase tracking-wider text-white/40">Compraron más de una vez</p><p className="mt-2 text-3xl font-black text-primary">{customers.filter((customer) => customer.orderCount > 1).length}</p></div>
            <div className={panelClass}><p className="text-xs font-black uppercase tracking-wider text-white/40">Total de pedidos</p><p className="mt-2 text-3xl font-black text-primary">{customers.reduce((sum, customer) => sum + customer.orderCount, 0)}</p></div>
          </div>

          <div className={panelClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-black text-white">Clientes que compraron</h2>
                </div>
                <p className="mt-1 text-sm text-white/40">Se agregan automáticamente al registrar un pedido.</p>
              </div>
              <label className="block w-full sm:max-w-sm">
                <span className="sr-only">Buscar cliente</span>
                <div className="relative">
                  <input
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    placeholder="Buscar por nombre, celular o email"
                    className={`${fieldClass} pr-10`}
                  />
                  <Search className="absolute right-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-white/35" />
                </div>
              </label>
            </div>

            {filteredCustomers.length ? (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {filteredCustomers.map((customer) => {
                  const phoneDigits = customer.phone.replace(/\D/g, '');
                  const whatsappPhone = phoneDigits.startsWith('54') ? phoneDigits : `549${phoneDigits.replace(/^0/, '')}`;
                  return (
                    <article key={customer.key} className="rounded-xl border border-white/[0.08] bg-black/25 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black text-white">{customer.name}</h3>
                          <p className="mt-1 text-xs text-white/35">Última compra: {new Date(customer.lastOrderAt).toLocaleDateString('es-AR')}</p>
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="font-black text-primary">{formatARS(Math.round(customer.totalSpent))}</p>
                          <p className="text-xs text-white/35">{customer.orderCount} {customer.orderCount === 1 ? 'pedido' : 'pedidos'}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-white/60">
                        {customer.phone ? (
                          <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary">
                            <Phone className="h-4 w-4 text-primary" /> {customer.phone}
                          </a>
                        ) : null}
                        {customer.email ? <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {customer.email}</p> : null}
                        {customer.address || customer.locality ? (
                          <p className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{[customer.address, customer.locality, customer.province].filter(Boolean).join(', ')}{customer.postalCode ? ` · CP ${customer.postalCode}` : ''}</span>
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-white/10 py-12 text-center">
                <Users className="mx-auto h-9 w-9 text-white/25" />
                <p className="mt-3 font-bold text-white/55">{customers.length ? 'No encontramos clientes con esa búsqueda.' : 'Todavía no hay compradores registrados.'}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'metrics' ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Ventas entregadas', formatARS(Math.round(stats.totalRevenue)), 'Total histórico confirmado'],
              ['Ventas del mes', formatARS(Math.round(stats.monthlyRevenue)), `${stats.monthlyOrders} pedidos no cancelados`],
              ['Ticket promedio', formatARS(Math.round(stats.averageTicket)), 'Promedio por pedido'],
              ['Stock bajo', String(stats.lowStock), 'Productos con 3 unidades o menos'],
            ].map(([label, value, hint]) => (
              <div key={label} className={panelClass}>
                <p className="text-[11px] font-black uppercase tracking-wider text-white/40">{label}</p>
                <p className="mt-2 break-words text-2xl font-black text-primary">{value}</p>
                <p className="mt-1 text-xs text-white/35">{hint}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className={panelClass}>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black text-white">Estado de pedidos</h2>
              </div>
              <div className="mt-5 space-y-3">
                {orderStatuses.map(([status, label]) => {
                  const amount = orders.filter((order) => order.status === status).length;
                  const width = orders.length ? Math.max((amount / orders.length) * 100, amount ? 4 : 0) : 0;
                  return (
                    <div key={status}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-white/60">{label}</span>
                        <span className="font-black text-white">{amount}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="text-lg font-black text-white">Productos más vendidos</h2>
              <p className="mt-1 text-xs text-white/40">No incluye pedidos cancelados.</p>
              <div className="mt-4 divide-y divide-white/[0.06]">
                {stats.topProducts.length ? stats.topProducts.map(([name, quantity], index) => (
                  <div key={name} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="min-w-0 text-white/70"><b className="mr-2 text-primary">#{index + 1}</b>{name}</span>
                    <span className="shrink-0 font-black text-white">{quantity} unidades</span>
                  </div>
                )) : <p className="py-8 text-center text-sm text-white/35">Todavía no hay ventas para comparar.</p>}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'coupons' ? (
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <form onSubmit={saveCoupon} className={panelClass}>
            <div className="flex items-center gap-2">
              <TicketPercent className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black text-white">{couponForm.id ? 'Editar cupón' : 'Nuevo cupón'}</h2>
            </div>
            <p className="mt-1 text-sm text-white/40">Creá códigos de descuento para usar en la bolsa.</p>

            <label className={`${labelClass} mt-5`}>
              Código
              <div className="mt-1.5 flex gap-2">
                <input
                  value={couponForm.code}
                  onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) }))}
                  placeholder="AB12CD3"
                  maxLength={7}
                  required
                  className={`${fieldClass} mt-0 font-mono text-base font-black tracking-[0.18em]`}
                />
                <button
                  type="button"
                  onClick={() => setCouponForm((current) => ({ ...current, code: generateCouponCode() }))}
                  className="min-h-11 shrink-0 rounded-lg border border-primary/40 px-3 text-xs font-black text-primary transition hover:bg-primary hover:text-black"
                >
                  Generar
                </button>
              </div>
            </label>

            <label className={`${labelClass} mt-4`}>
              Descuento
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="90"
                  step="1"
                  value={couponForm.discountPercent}
                  onChange={(event) => setCouponForm((current) => ({ ...current, discountPercent: event.target.value }))}
                  required
                  className={`${fieldClass} pr-10`}
                />
                <span className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 font-black text-white/40">%</span>
              </div>
            </label>

            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/[0.025] p-3">
              <span>
                <span className="block text-sm font-bold text-white">Cupón activo</span>
                <span className="block text-xs text-white/35">El cliente puede usarlo ahora.</span>
              </span>
              <input
                type="checkbox"
                checked={couponForm.active}
                onChange={(event) => setCouponForm((current) => ({ ...current, active: event.target.checked }))}
                className="h-5 w-5 accent-[#56f000]"
              />
            </label>

            <div className="mt-5 flex gap-2">
              <button disabled={saving} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-black text-black disabled:opacity-50">
                <Save className="h-4 w-4" /> {couponForm.id ? 'Guardar cambios' : 'Crear cupón'}
              </button>
              {couponForm.id ? (
                <button type="button" onClick={() => setCouponForm(emptyCoupon)} className="rounded-lg border border-white/10 px-4 font-bold text-white/60 hover:text-white">
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <div className={panelClass}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Cupones creados</h2>
                <p className="mt-1 text-sm text-white/40">Activá, desactivá, editá o eliminá cualquier código.</p>
              </div>
              <span className="text-sm font-bold text-white/45">{coupons.length} cupones</span>
            </div>

            <div className="mt-5 space-y-3">
              {coupons.map((coupon) => (
                <article key={coupon.id} className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-lg font-black tracking-[0.16em] text-white">{coupon.code}</span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">{coupon.discount_percent}% OFF</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${coupon.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.06] text-white/35'}`}>
                        {coupon.active ? 'Activo' : 'Desactivado'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/30">Creado el {new Date(coupon.created_at).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => toggleCoupon(coupon)} className="min-h-10 rounded-lg border border-white/10 px-3 text-xs font-bold text-white/65 hover:border-primary/40 hover:text-primary">
                      {coupon.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button type="button" onClick={() => editCoupon(coupon)} className="flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-bold text-white/65 hover:text-white">
                      <Edit className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button type="button" onClick={() => deleteCoupon(coupon.id)} aria-label={`Eliminar cupón ${coupon.code}`} className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
              {!coupons.length ? (
                <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-white/40">
                  <TicketPercent className="mx-auto h-9 w-9 text-white/20" />
                  <p className="mt-3 font-bold">Todavía no creaste cupones.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'offers' ? (
        <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={createOffer} className={`${panelClass} space-y-4`}>
            <div>
              <h2 className="text-xl font-black text-white">Nueva oferta</h2>
              <p className="mt-1 text-sm text-white/45">El precio original no se modifica.</p>
            </div>
            <label className={labelClass}>
              Buscar producto
              <div className="relative">
                <input
                  value={offerProductSearch}
                  onChange={(event) => {
                    setOfferProductSearch(event.target.value);
                    setOfferProductId('');
                  }}
                  className={`${fieldClass} pr-10`}
                  placeholder="Nombre, modelo o categoría"
                />
                <Search className="absolute right-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-white/35" />
              </div>
            </label>
            <label className={labelClass}>
              Filtrar por categoría
              <select
                value={offerCategoryFilter}
                onChange={(event) => {
                  setOfferCategoryFilter(event.target.value);
                  setOfferProductId('');
                }}
                className={fieldClass}
              >
                <option value="">Todas las categorías</option>
                {sortedCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Producto
              <select required value={offerProductId} onChange={(event) => setOfferProductId(event.target.value)} className={fieldClass}>
                <option value="">{offerProductOptions.length ? `Seleccionar entre ${offerProductOptions.length} productos` : 'No hay productos con esos filtros'}</option>
                {offerProductOptions.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} · {formatARS(Math.round(product.price))}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Porcentaje de descuento
              <div className="relative">
                <input required type="number" min="1" max="90" value={offerPercent} onChange={(event) => setOfferPercent(event.target.value)} className={`${fieldClass} pr-10`} />
                <span className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 font-black text-primary">%</span>
              </div>
            </label>
            <label className={labelClass}>
              Título
              <input value={offerTitle} onChange={(event) => setOfferTitle(event.target.value)} className={fieldClass} placeholder="Oferta especial" />
            </label>
            {offerProductId ? (() => {
              const product = products.find((item) => item.id === offerProductId);
              const percent = Math.min(90, Math.max(1, Number(offerPercent) || 0));
              if (!product) return null;
              return (
                <div className="rounded-lg border border-primary/20 bg-primary/[0.06] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/45">Precio con descuento</p>
                  <p className="mt-1 text-2xl font-black text-primary">{formatARS(Math.round(product.price * (1 - percent / 100)))}</p>
                </div>
              );
            })() : null}
            <button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2 font-bold text-black disabled:opacity-50">
              <Save className="h-4 w-4" /> Publicar oferta
            </button>
          </form>

          <div className={`${panelClass} space-y-3`}>
            <div>
              <h2 className="text-xl font-black text-white">Ofertas publicadas</h2>
              <p className="mt-1 text-sm text-white/45">Administrá qué promociones aparecen en la sección Ofertas.</p>
            </div>
            {offers.length === 0 ? <p className="rounded-lg border border-white/[0.08] p-4 text-sm text-white/45">No hay ofertas creadas.</p> : null}
            {offers.map((offer) => (
              <div key={offer.id} className="flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-black/25 p-4 sm:flex-row sm:items-center">
                <img src={offer.products?.image_url} alt="" className="h-20 w-20 rounded-lg bg-white object-contain p-2" />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-white">{offer.products?.name || 'Producto eliminado'}</p>
                  <p className="mt-1 text-sm text-white/45">{offer.title} · <span className="font-bold text-primary">{offer.badge}</span></p>
                  <p className="mt-1 font-black text-white">{formatARS(Math.round(Number(offer.offer_price || 0)))}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateOffer(offer.id, { activo: !offer.activo })} className={`min-h-10 rounded-lg border px-3 text-sm font-bold ${offer.activo ? 'border-primary/30 bg-primary/10 text-primary' : 'border-white/10 text-white/45'}`}>
                    {offer.activo ? 'Visible' : 'Oculta'}
                  </button>
                  <button type="button" onClick={() => deleteOffer(offer.id)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-secondary/25 bg-secondary/10 text-secondary" aria-label="Eliminar oferta">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Pedidos</h2>
              <p className="mt-1 text-sm text-white/45">Gestioná la preparación, el envío y la entrega desde acá.</p>
            </div>
            <span className="text-sm font-bold text-white/50">{orders.length} pedidos registrados</span>
          </div>

          {orders.length === 0 ? (
            <div className={`${panelClass} py-12 text-center`}>
              <PackageCheck className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-4 font-bold text-white">Todavía no hay pedidos.</p>
              <p className="mt-1 text-sm text-white/45">Cuando alguien compre desde la bolsa aparecerá automáticamente.</p>
            </div>
          ) : null}

          {orders.map((order) => (
            <form
              key={order.id}
              className={panelClass}
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                updateOrder(order.id, {
                  shipping_provider: String(form.get('shipping_provider') || '').trim() || null,
                  shipping_service: String(form.get('shipping_service') || '').trim() || null,
                  tracking_number: String(form.get('tracking_number') || '').trim() || null,
                  admin_notes: String(form.get('admin_notes') || '').trim() || null,
                });
              }}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-white">Pedido #{order.id.slice(0, 8).toUpperCase()}</h3>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-white/60">
                      {new Date(order.created_at).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/55">
                    <span>{order.customer_name || 'Cliente sin nombre'}</span>
                    <span>{order.customer_phone || 'Teléfono por WhatsApp'}</span>
                    {order.customer_email ? <span>{order.customer_email}</span> : null}
                    <span>{adminPaymentLabel(order.payment_method)}</span>
                    {order.coupon_code ? <span className="font-bold text-primary">Cupón {order.coupon_code} · -{formatARS(Math.round(Number(order.discount_amount || 0)))}</span> : null}
                  </div>
                  <div className="mt-4 grid gap-3 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-primary">Dirección de entrega</p>
                      <p className="mt-1 text-white/75">
                        {[order.customer_address, order.customer_locality, order.customer_province].filter(Boolean).join(', ') || 'Sin dirección cargada'}
                        {order.customer_postal_code ? ` · CP ${order.customer_postal_code}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-primary">Observaciones del cliente</p>
                      <p className="mt-1 whitespace-pre-wrap text-white/75">{order.customer_notes || 'Sin observaciones'}</p>
                    </div>
                  </div>
                  <div className="mt-4 divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-black/30">
                    {(order.order_items || []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                        <span className="min-w-0 text-white/75">{item.quantity} × {item.products?.name || 'Producto'}</span>
                        <span className="shrink-0 font-bold text-white">{formatARS(Math.round(item.price * item.quantity))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full shrink-0 lg:w-72">
                  <label className={labelClass}>
                    Estado
                    <select
                      className={fieldClass}
                      value={order.status}
                      disabled={saving}
                      onChange={(event) => updateOrder(order.id, { status: event.target.value as AdminOrder['status'] })}
                    >
                      {orderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <p className="mt-3 text-right text-2xl font-black text-primary">{formatARS(Math.round(order.total_price || 0))}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <label className={labelClass}>Transportista<input name="shipping_provider" defaultValue={order.shipping_provider || ''} className={fieldClass} placeholder="Correo Argentino" /></label>
                <label className={labelClass}>Servicio<input name="shipping_service" defaultValue={order.shipping_service || ''} className={fieldClass} placeholder="Domicilio" /></label>
                <label className={labelClass}>Seguimiento<input name="tracking_number" defaultValue={order.tracking_number || ''} className={fieldClass} placeholder="Código de seguimiento" /></label>
                <label className={labelClass}>Nota interna<input name="admin_notes" defaultValue={order.admin_notes || ''} className={fieldClass} placeholder="Observaciones" /></label>
              </div>

              <div className="mt-4 flex justify-end">
                <button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2 font-bold text-black disabled:opacity-50">
                  <Truck className="h-4 w-4" /> Guardar datos de envío
                </button>
              </div>
            </form>
          ))}
        </div>
      ) : null}

      {activeTab === 'products' ? (
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(560px,0.95fr)_minmax(0,1.35fr)]">
          <form onSubmit={saveProduct} className={`${panelClass} space-y-5 p-6 lg:p-7`}>
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="text-2xl font-black text-white">{productForm.id ? 'Editar producto' : 'Nuevo producto'}</h2>
              <p className="mt-1 text-sm text-white/40">Completá los datos principales, precios, imágenes y medidas del producto.</p>
            </div>
            <label className={labelClass}>Nombre<input required className={fieldClass} value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></label>
            <label className={labelClass}>Descripcion<textarea required className={`${fieldClass} min-h-32`} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Precio normal ARS (opcional)<input type="number" min="0" placeholder="Dejá vacío para consultar" className={fieldClass} value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></label>
              <label className={labelClass}>Precio por transferencia ARS (opcional)<input type="number" min="0" placeholder="Ej: 85000" className={fieldClass} value={productForm.transfer_price} onChange={(e) => setProductForm({ ...productForm, transfer_price: e.target.value })} /></label>
              <label className={labelClass}>Stock<input required type="number" min="0" className={fieldClass} value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Categoria
                <select required className={fieldClass} value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                  <option value="">Seleccionar categoria</option>
                  {productForm.category && !categories.some((category) => category.name === productForm.category) ? (
                    <option value={productForm.category}>{productForm.category}</option>
                  ) : null}
                  {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                Modelo de moto
                <select className={fieldClass} value={productForm.motorcycle_model} onChange={(e) => setProductForm({ ...productForm, motorcycle_model: e.target.value })}>
                  <option value="">Sin modelo</option>
                  {availableMotorcycleModels.map((model) => <option key={model} value={model}>{model}</option>)}
                </select>
              </label>
            </div>
            <label className={labelClass}>
              Imagen principal
              <input type="file" accept="image/*" className={fieldClass} disabled={uploading} onChange={(e) => uploadProductFiles(e.target.files, 'main')} />
            </label>
            <label className={labelClass}>
              Imagen principal URL
              <input
                required
                className={fieldClass}
                value={productForm.image_url}
                onPaste={(e) => pasteProductImage(e, 'main')}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                placeholder="Pega una URL o una imagen copiada con Ctrl + V"
              />
            </label>
            <label className={labelClass}>Colores separados por coma<input className={fieldClass} value={productForm.colors} onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })} /></label>
            <fieldset className="rounded-xl border border-primary/25 bg-primary/[0.04] p-5">
              <legend className="px-2 text-sm font-black uppercase tracking-wider text-primary">Datos para calcular el envío</legend>
              <p className="mb-4 text-xs leading-relaxed text-gray-300">Medí el producto ya embalado. Correo Argentino y Andreani usan estos datos para calcular el precio.</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2">
                <label className={labelClass}>Peso en gramos<input required type="number" min="1" className={fieldClass} value={productForm.weight_grams} onChange={(e) => setProductForm({ ...productForm, weight_grams: e.target.value })} /></label>
                <label className={labelClass}>Largo en cm<input required type="number" min="1" step="0.1" className={fieldClass} value={productForm.length_cm} onChange={(e) => setProductForm({ ...productForm, length_cm: e.target.value })} /></label>
                <label className={labelClass}>Ancho en cm<input required type="number" min="1" step="0.1" className={fieldClass} value={productForm.width_cm} onChange={(e) => setProductForm({ ...productForm, width_cm: e.target.value })} /></label>
                <label className={labelClass}>Alto en cm<input required type="number" min="1" step="0.1" className={fieldClass} value={productForm.height_cm} onChange={(e) => setProductForm({ ...productForm, height_cm: e.target.value })} /></label>
              </div>
            </fieldset>
            <label className={`${labelClass} flex items-center gap-3 rounded-md border border-purple-800/50 bg-purple-950/25 p-3`}>
              <input
                type="checkbox"
                checked={productForm.is_best_seller}
                onChange={(e) => setProductForm({ ...productForm, is_best_seller: e.target.checked })}
                className="h-4 w-4 accent-purple-600"
              />
              <span>Producto mas vendido</span>
            </label>
            <label className={labelClass}>
              Subir mas imagenes
              <input type="file" accept="image/*" multiple className={fieldClass} disabled={uploading} onChange={(e) => uploadProductFiles(e.target.files, 'extra')} />
            </label>
            <label className={labelClass}>
              Mas imagenes, una por linea
              <textarea
                className={`${fieldClass} min-h-20`}
                value={productForm.extra_images}
                onPaste={(e) => pasteProductImage(e, 'extra')}
                onChange={(e) => setProductForm({ ...productForm, extra_images: e.target.value })}
                placeholder="Pega URLs o imagenes. Para color: Rojo - https://..."
              />
            </label>
            <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row">
              <button disabled={saving || uploading} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-black text-black disabled:opacity-60">
                <Save className="h-4 w-4" />
                {uploading ? 'Subiendo...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setProductForm(emptyProduct)} className="min-h-12 rounded-lg border border-white/20 px-6 py-3 font-bold text-gray-200">Limpiar</button>
            </div>
          </form>

          <div className="space-y-6">
            <div className={`${panelClass} space-y-3`}>
              <div className="relative">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Buscar producto para editar"
                  className={`${fieldClass} pr-11`}
                />
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className={`${panelClass} overflow-x-auto`}>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-white"><tr><th className="p-2">Producto</th><th className="p-2">Categoria</th><th className="p-2">Modelo</th><th className="p-2">Precio</th><th className="p-2">Transferencia</th><th className="p-2">Stock</th><th className="p-2">Paquete</th><th className="p-2">Mas vendido</th><th className="p-2">Acciones</th></tr></thead>
                <tbody>{filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-white/10 text-gray-200">
                    <td className="p-2">{product.name}</td><td className="p-2">{product.category}</td><td className="p-2">{product.motorcycle_model || 'Sin modelo'}</td><td className="p-2 text-white">{product.price > 0 ? formatARS(Math.round(product.price)) : 'Consultar precio'}</td><td className="p-2 font-bold text-primary">{product.transfer_price != null && product.transfer_price > 0 ? formatARS(Math.round(product.transfer_price)) : '—'}</td><td className="p-2">{product.stock}</td><td className="p-2 text-xs">{product.weight_grams || 500} g<br />{product.length_cm || 20}×{product.width_cm || 15}×{product.height_cm || 10} cm</td><td className="p-2">{product.is_best_seller ? 'Si' : 'No'}</td>
                    <td className="flex gap-2 p-2"><button onClick={() => editProduct(product)} className="rounded bg-white/10 p-2"><Edit className="h-4 w-4" /></button><button onClick={() => deleteProduct(product.id)} className="rounded bg-purple-500/20 p-2 text-purple-300"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'models' ? (
        <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={createMotorcycleModel} className={`${panelClass} space-y-4`}>
            <div>
              <h2 className="text-xl font-black text-white">Nuevo modelo de moto</h2>
              <p className="mt-1 text-sm text-white/45">Aparecerá en los filtros de la tienda y al cargar productos.</p>
            </div>
            <label className={labelClass}>
              Nombre del modelo
              <input
                required
                value={modelName}
                onChange={(event) => setModelName(event.target.value)}
                className={fieldClass}
                placeholder="Ej: Honda Tornado 250"
              />
            </label>
            <button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2 font-bold text-black disabled:opacity-50">
              <Save className="h-4 w-4" /> Agregar modelo
            </button>
          </form>

          <div className={`${panelClass} space-y-3`}>
            <div>
              <h2 className="text-xl font-black text-white">Modelos disponibles</h2>
              <p className="mt-1 text-sm text-white/45">Podés renombrar, ordenar, ocultar o eliminar cada opción.</p>
            </div>
            {motorcycleModels.length === 0 ? (
              <p className="rounded-lg border border-white/[0.08] bg-black/20 p-4 text-sm text-white/50">
                Ejecutá la migración de modelos en Supabase para comenzar a administrarlos.
              </p>
            ) : null}
            {motorcycleModels.map((model) => (
              <div key={model.id} className="grid gap-3 rounded-lg border border-white/[0.08] bg-black/25 p-4 sm:grid-cols-[1fr_90px_auto_auto] sm:items-end">
                <label className={labelClass}>
                  Modelo
                  <input
                    defaultValue={model.name}
                    className={fieldClass}
                    onBlur={(event) => {
                      const name = event.target.value.trim();
                      if (name && name !== model.name) updateMotorcycleModel(model.id, { name });
                    }}
                  />
                </label>
                <label className={labelClass}>
                  Orden
                  <input
                    type="number"
                    min="0"
                    defaultValue={model.orden}
                    className={fieldClass}
                    onBlur={(event) => {
                      const orden = Number(event.target.value);
                      if (orden !== model.orden) updateMotorcycleModel(model.id, { orden });
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => updateMotorcycleModel(model.id, { activo: !model.activo })}
                  className={`min-h-11 rounded-lg border px-4 text-sm font-bold ${model.activo ? 'border-primary/30 bg-primary/10 text-primary' : 'border-white/10 text-white/45'}`}
                >
                  {model.activo ? 'Visible' : 'Oculto'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteMotorcycleModel(model.id)}
                  aria-label={`Eliminar ${model.name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-secondary/25 bg-secondary/10 text-secondary"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'categories' ? (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={saveCategory} className={`${panelClass} space-y-3`}>
            <h2 className="text-xl font-bold text-white">{categoryForm.id ? 'Editar categoria' : 'Nueva categoria'}</h2>
            <label className={labelClass}>Nombre<input required className={fieldClass} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /></label>
            <label className={labelClass}>Descripcion<textarea className={`${fieldClass} min-h-24`} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></label>
            <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
              Usa la imagen general de MotoSport Neuquén y el orden se asigna automaticamente al crear.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>Orden actual<input type="number" className={fieldClass} value={categoryForm.orden} onChange={(e) => setCategoryForm({ ...categoryForm, orden: e.target.value })} disabled={!categoryForm.id} /></label>
              <label className={`${labelClass} flex items-center gap-3 pt-7`}>
                <input type="checkbox" checked={categoryForm.activo} onChange={(e) => setCategoryForm({ ...categoryForm, activo: e.target.checked })} />
                <span>Categoria activa</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 font-bold text-black disabled:opacity-60">
                <Save className="h-4 w-4" />
                Guardar categoria
              </button>
              <button type="button" onClick={() => setCategoryForm(emptyCategory)} className="rounded-md border border-white/20 px-4 py-2 text-gray-200">Limpiar</button>
            </div>
          </form>

          <div className={`${panelClass} overflow-x-auto`}>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-white"><tr><th className="p-2">Nombre</th><th className="p-2">Orden</th><th className="p-2">Estado</th><th className="p-2">Descripcion</th><th className="p-2">Acciones</th></tr></thead>
              <tbody>{sortedCategories.map((category) => (
                <tr key={category.id} className="border-t border-white/10 text-gray-200">
                  <td className="p-2 font-semibold text-white">{category.name}</td>
                  <td className="p-2">{category.orden ?? 0}</td>
                  <td className="p-2">{category.activo ? 'Activa' : 'Oculta'}</td>
                  <td className="p-2">{category.description || 'Sin descripcion'}</td>
                  <td className="flex gap-2 p-2">
                    <button onClick={() => editCategory(category)} className="rounded bg-white/10 p-2"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => deleteCategory(category.id)} className="rounded bg-purple-500/20 p-2 text-purple-300"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === 'testimonials' ? (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={saveTestimonial} className={`${panelClass} space-y-3`}>
            <h2 className="text-xl font-bold text-white">{testimonialForm.id ? 'Editar reseña' : 'Nueva reseña'}</h2>
            <label className={labelClass}>Nombre<input required className={fieldClass} value={testimonialForm.nombre} onChange={(e) => setTestimonialForm({ ...testimonialForm, nombre: e.target.value })} /></label>
            <label className={labelClass}>Mensaje<textarea required className={`${fieldClass} min-h-24`} value={testimonialForm.mensaje} onChange={(e) => setTestimonialForm({ ...testimonialForm, mensaje: e.target.value })} /></label>
            <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
              Usa la imagen general de MotoSport Neuquén y el orden se asigna automaticamente al crear.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>Orden actual<input type="number" className={fieldClass} value={testimonialForm.orden} onChange={(e) => setTestimonialForm({ ...testimonialForm, orden: e.target.value })} disabled={!testimonialForm.id} /></label>
              <label className={`${labelClass} flex items-center gap-3 pt-7`}>
                <input type="checkbox" checked={testimonialForm.activo} onChange={(e) => setTestimonialForm({ ...testimonialForm, activo: e.target.checked })} />
                <span>Mostrar reseña</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 font-bold text-black disabled:opacity-60">
                <Save className="h-4 w-4" />
                Guardar reseña
              </button>
              <button type="button" onClick={() => setTestimonialForm(emptyTestimonial)} className="rounded-md border border-white/20 px-4 py-2 text-gray-200">Limpiar</button>
            </div>
          </form>

          <div className={`${panelClass} space-y-2`}>
            {sortedTestimonials.length === 0 ? (
              <div className="rounded-md border border-white/10 bg-white/5 p-3 text-gray-300">
                Todavia no hay reseñas cargadas.
              </div>
            ) : null}
            {sortedTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="rounded-md border border-white/10 bg-white/5 p-4 text-gray-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-white">{testimonial.nombre}</p>
                    <p className="mt-2 text-sm text-gray-300">{testimonial.mensaje}</p>
                    <p className="mt-2 text-xs text-gray-500">Orden: {testimonial.orden} | {testimonial.activo ? 'Visible' : 'Oculta'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editTestimonial(testimonial)} className="rounded bg-white/10 p-2"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => deleteTestimonial(testimonial.id)} className="rounded bg-purple-500/20 p-2 text-purple-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'debtors' ? (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={saveDebtor} className={`${panelClass} space-y-3`}>
            <h2 className="text-xl font-bold text-white">{debtorForm.id ? 'Editar deudor' : 'Nuevo deudor'}</h2>
            <label className={labelClass}>Nombre<input required className={fieldClass} value={debtorForm.debtor_name} onChange={(e) => setDebtorForm({ ...debtorForm, debtor_name: e.target.value })} /></label>
            <label className={labelClass}>Precio que debe<input required type="number" min="0" className={fieldClass} value={debtorForm.amount_due} onChange={(e) => setDebtorForm({ ...debtorForm, amount_due: e.target.value })} /></label>
            <label className={labelClass}>Producto que compro<input required className={fieldClass} value={debtorForm.product_name} onChange={(e) => setDebtorForm({ ...debtorForm, product_name: e.target.value })} /></label>
            <div className="border-t border-white/10 pt-3">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-gray-400">Opcional</p>
              <div className="space-y-3">
                <label className={labelClass}>Numero de celu<input className={fieldClass} value={debtorForm.phone} onChange={(e) => setDebtorForm({ ...debtorForm, phone: e.target.value })} /></label>
                <label className={labelClass}>DNI<input className={fieldClass} value={debtorForm.dni} onChange={(e) => setDebtorForm({ ...debtorForm, dni: e.target.value })} /></label>
                <label className={labelClass}>Cuando viene a pagar<input type="date" className={fieldClass} value={debtorForm.due_date} onChange={(e) => setDebtorForm({ ...debtorForm, due_date: e.target.value })} /></label>
              </div>
            </div>
            <div className="flex gap-2">
              <button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2 font-bold text-black"><Save className="h-4 w-4" />Guardar deudor</button>
              <button type="button" onClick={() => setDebtorForm(emptyDebtor)} className="rounded-md border border-white/20 px-4 py-2 text-gray-200">Limpiar</button>
            </div>
          </form>
          <div className={`${panelClass} space-y-2`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-white">Deudores pendientes</h2>
              <button type="button" onClick={exportDebtorsCsv} className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm font-bold text-white">
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
            {pendingDebtors.length === 0 ? (
              <div className="rounded-md border border-white/10 bg-white/5 p-3 text-gray-300">
                No hay deudores pendientes.
              </div>
            ) : null}
            {pendingDebtors.map((debtor) => (
              <div key={debtor.id} className="rounded-md border border-white/10 bg-white/5 p-4 text-gray-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-white">{debtor.debtor_name}</p>
                    <p className="mt-1 text-sm text-gray-300">{debtor.product_name}</p>
                    {debtor.phone ? <p className="mt-2 text-sm text-gray-400">Cel: {debtor.phone}</p> : null}
                    {debtor.dni ? <p className="text-sm text-gray-400">DNI: {debtor.dni}</p> : null}
                    {debtor.due_date ? <p className="text-sm text-gray-400">Viene a pagar: {debtor.due_date}</p> : null}
                  </div>
                  <div className="shrink-0 rounded-xl border border-purple-700/80 bg-purple-950/50 px-4 py-3 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">Debe</p>
                    <p className="mt-1 text-2xl font-black text-white">{formatARS(Math.round(debtor.amount_due || 0))}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => markDebtorAsPaid(debtor.id)} className="rounded bg-green-500/20 p-2 text-green-300" title="Marcar como pagado"><CheckCircle className="h-4 w-4" /></button>
                  <button onClick={() => editDebtor(debtor)} className="rounded bg-white/10 p-2"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => deleteDebtor(debtor.id)} className="rounded bg-purple-500/20 p-2 text-purple-300"><Trash2 className="h-4 w-4" /></button>
                  <p className="ml-auto text-xs text-gray-500">{new Date(debtor.created_at).toLocaleDateString('es-AR')}</p>
                </div>
              </div>
            ))}
            {paidDebtors.length > 0 ? (
              <div className="mt-6 border-t border-white/10 pt-4">
                <h2 className="mb-3 text-xl font-bold text-white">Historial pagado</h2>
                <div className="space-y-2">
                  {paidDebtors.map((debtor) => (
                    <div key={debtor.id} className="rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm text-gray-200">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-bold text-white">{debtor.debtor_name}</p>
                          <p className="text-gray-300">{debtor.product_name}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="font-black text-green-200">{formatARS(Math.round(debtor.amount_due || 0))}</p>
                          <p className="text-xs text-gray-400">{debtor.paid_at ? new Date(debtor.paid_at).toLocaleDateString('es-AR') : 'Pagado'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
