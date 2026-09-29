# Configurar envíos

El sitio incluye un endpoint seguro en Cloudflare para cotizar **Correo Argentino**
y **Andreani** en paralelo. Las claves no deben guardarse en GitHub ni en variables `VITE_*`.

## Datos necesarios

### Correo Argentino (MiCorreo)
- Código postal del local desde donde se despachan los pedidos.
- Usuario API de MiCorreo (`userToken`).
- Contraseña API de MiCorreo (`passwordToken`).
- `customerId` de MiCorreo (se obtiene de `/users/validate`).

### Andreani
- Usuario de la API de Andreani.
- Contraseña de la API de Andreani.
- Código de cliente (ej: `CL0003750`).
- Contrato de envío a domicilio (ej: `400006711`).
- Contrato de retiro en sucursal (ej: `400006712`).

## Cargar secretos de Correo Argentino

Desde la carpeta del proyecto:

```powershell
npx wrangler secret put SHIPPING_ORIGIN_POSTAL_CODE
npx wrangler secret put CORREO_API_USER
npx wrangler secret put CORREO_API_PASSWORD
npx wrangler secret put CORREO_CUSTOMER_ID
```

La API usada es MiCorreo v1 (`/token` y `/rates`).

## Cargar secretos de Andreani

```powershell
npx wrangler secret put ANDREANI_USER
npx wrangler secret put ANDREANI_PASS
npx wrangler secret put ANDREANI_CLIENT_CODE
npx wrangler secret put ANDREANI_CONTRACT_DOMICILIO
npx wrangler secret put ANDREANI_CONTRACT_SUCURSAL
```

La API usada es Andreani REST v1/v2 (`/login`, `/v1/tarifas`).

## Despliegue

Cada comando solicita el valor sin escribirlo en los archivos del proyecto.
Después de cargar todos los secretos, volver a desplegar el Worker:

```powershell
npx wrangler deploy
```

> **Nota:** Cada carrier funciona de forma independiente. Si solo tenés
> credenciales de uno, el otro se mostrará como "no disponible" en las
> cotizaciones sin afectar el funcionamiento.
