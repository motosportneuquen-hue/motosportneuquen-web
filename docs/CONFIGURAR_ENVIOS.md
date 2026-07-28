# Configurar envíos

El sitio ya incluye un endpoint seguro en Cloudflare para cotizar Correo Argentino.
Las claves no deben guardarse en GitHub ni en variables `VITE_*`.

## Datos necesarios

- Código postal del local desde donde se despachan los pedidos.
- Usuario API de MiCorreo.
- Contraseña API de MiCorreo.
- `customerId` de MiCorreo.
- Credential ID y contrato/API habilitada de Andreani.

## Cargar secretos de Correo Argentino

Desde la carpeta del proyecto:

```powershell
npx wrangler secret put SHIPPING_ORIGIN_POSTAL_CODE
npx wrangler secret put CORREO_API_USER
npx wrangler secret put CORREO_API_PASSWORD
npx wrangler secret put CORREO_CUSTOMER_ID
```

Cada comando solicita el valor sin escribirlo en los archivos del proyecto.
Después, volver a desplegar el Worker.

La API usada es MiCorreo v1 (`/token` y `/rates`). Andreani queda indicada en la
interfaz como pendiente hasta contar con la credencial y conocer el contrato
habilitado para no conectar un endpoint o tarifa incorrectos.
