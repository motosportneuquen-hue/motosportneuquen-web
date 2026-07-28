# Configurar el Supabase nuevo

Este procedimiento está preparado para un proyecto recién creado.

## 1. Crear toda la base

1. Abrí el proyecto en Supabase.
2. Entrá en **SQL Editor**.
3. Elegí **New query**.
4. Copiá todo el contenido de `bootstrap_new_project.sql`.
5. Presioná **Run**.

El script crea:

- productos, categorías, imágenes y ofertas;
- usuarios, perfiles y permisos de administrador;
- pedidos, carrito y reseñas;
- testimonios y deudores;
- campos de peso y medidas para los envíos;
- el bucket público `product-images`;
- políticas RLS y la función segura de compra;
- las nueve categorías iniciales.

## 2. Crear el usuario administrador

1. Registrate desde la opción **Mi cuenta** de la tienda.
2. Volvé al SQL Editor.
3. Ejecutá, reemplazando el correo:

```sql
UPDATE public.profiles p
SET is_admin = true
FROM auth.users u
WHERE p.id = u.id
  AND u.email = 'TU_CORREO';
```

4. Cerrá sesión en la tienda y volvé a ingresar.
5. Abrí `/admin-speedy`.

## 3. Verificar la instalación

Ejecutá:

```sql
SELECT
  to_regclass('public.products') AS products,
  to_regclass('public.categories') AS categories,
  to_regclass('public.orders') AS orders,
  to_regclass('public.product_images') AS product_images;

SELECT count(*) AS categorias_creadas
FROM public.categories;
```

Las cuatro columnas deben mostrar el nombre de la tabla y `categorias_creadas`
debe devolver `9`.

Desde el proyecto también podés ejecutar:

```bash
npm run verify-supabase
```

El resultado debe mostrar `OK` para cada tabla.

## Importante

- No pegues en GitHub la contraseña de la base, una `service_role` ni secretos
  de los correos.
- La clave `sb_publishable_...` usada por la web sí es una clave pública.
- Para Correo Argentino y Andreani, las credenciales privadas se cargarán como
  secretos de Cloudflare cuando estén disponibles.
