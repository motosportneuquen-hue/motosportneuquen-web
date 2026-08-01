-- Reinicia los datos comerciales del panel sin tocar el catalogo ni los accesos.
-- Conserva: products, product_images, categories, motorcycle_brands,
-- motorcycle_models, profiles y auth.users.

BEGIN;

TRUNCATE TABLE
  public.order_notifications,
  public.order_items,
  public.orders,
  public.cart_items,
  public.reviews,
  public.testimonials,
  public.offers,
  public.debtors,
  public.coupons
RESTART IDENTITY CASCADE;

COMMIT;
