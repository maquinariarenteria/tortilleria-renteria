# Stripe Payments — Maquinaria Rentería

Plan generado por el plugin oficial de Stripe el 9 de octubre de 2026.
Cuenta autorizada: «Entorno de prueba de Maquinaria renteria», modo de prueba.
Plan: `iguide_61VY68rJWKOp9jrVq411LP5iYfFBx`.

## Flujo

- React envía identificadores de equipos/variantes y cantidades al Worker.
- El Worker verifica catálogo, moneda y total; ignora importes arbitrarios del navegador.
- Solo se acepta pago completo del 100%. Flete aparte. Se rechazan solicitudes de anticipo en el servidor.
- D1 conserva el pedido pendiente y Stripe Checkout recoge los datos de pago.
- El webhook firmado confirma pagos efectivos; entregas repetidas no duplican órdenes.
- El retorno consulta Stripe si el webhook aún no llega. La URL de éxito no confirma pagos por sí sola.
- Administración consulta órdenes pagadas del servidor, muestra el pago completo confirmado y permite guardar el estado de fabricación.

## Configuración pendiente

Conectar el plugin no entrega una clave de API al sitio ni configura Cloudflare automáticamente.

1. Confirma dominio y proyecto Worker. D1 ya creada: `tortilleria-renteria-db`, identificador `ac44058f-141b-4dd0-8cfe-7e7df1aaf67d`. SITE_URL apunta a `https://maquinaria-renteria.com`. R2 todavía no está activado en la cuenta y su vínculo opcional se excluye del despliegue hasta configurarlo.
2. En el entorno de prueba autorizado, crea una **clave restringida** para este Worker con acceso de lectura/escritura a Checkout Sessions y permisos necesarios para los precios y productos usados en `price_data`. Verifica permisos con una sesión de prueba. No guardes claves en GitHub ni en variables `VITE_*`.
3. Configura en Cloudflare, como secretos del Worker:
   - `STRIPE_SECRET_KEY`: la clave restringida del mismo entorno de prueba.
   - `STRIPE_WEBHOOK_SECRET`: secreto de firma del webhook del mismo entorno.
   - `ADMIN_PASSWORD`: contraseña privada; ya no se admiten contraseñas de respaldo públicas.
   - `ADMIN_JWT_SECRET`: secreto independiente para firmar las sesiones del administrador (si no se configura se usa ADMIN_PASSWORD).
4. Configura `SITE_URL` con el origen exacto de la web (ejemplo: `https://tu-dominio.mx`). Debe coincidir con el dominio desde el cual se inicia Checkout.
5. Aplica las migraciones existentes sin borrar datos. Para instalaciones existentes, aplica al menos:
   `npx wrangler d1 execute tortilleria-renteria-db --remote --file=migrations/0002_stripe_orders.sql`
   Para una base nueva aplica antes `migrations/0001_initial_schema.sql`.
6. Despliega el Worker y los assets. Se requiere que `/api/*` pase primero por el Worker.
7. En Stripe Workbench registra un destino webhook con eventos **snapshot**:
   URL: `https://TU-DOMINIO/api/stripe/webhook`.
   Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`.
   Copia el secreto de firma al secreto Cloudflare `STRIPE_WEBHOOK_SECRET` y vuelve a desplegar si hace falta.
8. Inicia sesión nuevamente en el panel: los tokens anteriores ya no son válidos.

La integración usa Stripe SDK 23 y su versión API predeterminada `2026-09-30.endive`.
Para desarrollo local usa `.dev.vars` (ignorado por Git) y Wrangler; `npm run dev` solo sirve React y no inicia las APIs del Worker.
Para activar el control local de credenciales: `git config core.hooksPath .githooks`.

## Verificación

`npm run build` y `npm run test:stripe`.
Las pruebas automatizadas simulan Stripe y D1; no sustituyen una prueba de punta a punta con claves del sandbox y el Worker desplegado.

Antes de activar producción probar: compra completa al 100%, rechazo de anticipos, MXN/USD, variantes, factura, cancelación, tarjeta rechazada, 3D Secure, entrega duplicada de webhook y pagos pendientes. Confirmar importe en Stripe y en D1. Usar exclusivamente tarjetas de prueba en el entorno de prueba.

## Límites y decisiones conservadas

- No se admiten anticipos, cuotas ni pagos parciales; no se guarda tarjeta.
- El cálculo existente de IVA al solicitar factura se conserva. Este cambio no implementa CFDI ni revisa obligaciones fiscales.
- El catálogo base/variantes proviene del código. Los precios base sincronizados en D1 prevalecen. Un producto nuevo creado solo en localStorage no se habilita para cobro automáticamente; un precio discrepante se rechaza. Antes de publicar precios nuevos actualiza/sincroniza el catálogo del servidor.
- Se guardan pagos y estados en D1; el correo antiguo del navegador no se usa como prueba de pago. Los avisos al vendedor se generan en el servidor al verificar el pago.
- Reembolsos, disputas y sincronización de métricas/CRM locales quedan fuera de esta integración inicial.
- La clave y el webhook de producción serán distintos; no cambiar a producción hasta completar las pruebas.
- El administrador lista únicamente los pedidos del entorno de la clave activa: `cs_test_*` en pruebas y `cs_live_*` en producción. El historial del otro entorno se conserva en D1, pero no se suma a las ventas ni aparece en el listado del entorno activo.

## Correos de compra

- El carrito exige un correo válido para pagar con tarjeta; el servidor lo vuelve a validar antes de crear Checkout.
- El Worker pasa ese correo como `customer_email` y `payment_intent_data.receipt_email`. En compras reales, Stripe envía el recibo al confirmarse el pago, incluso si la opción general de recibos no está activada. La descripción y metadata del pago incluyen el folio del pedido.
- Stripe puede enviar un aviso adicional al usuario de su cuenta: Configuración → Preferencias de comunicación → Transacciones y saldos → «Recibo de pago exitoso - Email». El aviso completo de esta tienda se envía por Cloudflare Email Service al correo configurado en `ORDER_NOTIFICATION_TO`.
- Para activar también los recibos generales: Configuración → Empresa → Correos electrónicos de clientes → Pagos efectuados correctamente. Revisar esta opción y el aviso al vendedor en la cuenta real antes del lanzamiento.
- Stripe no envía automáticamente los recibos de compras de prueba por defecto; una compra simulada no demuestra entrega al correo. Probar el recibo con envío manual desde Stripe a un destinatario autorizado y revisar el historial de recibos. El sandbox puede restringir destinatarios a miembros del equipo o dominios verificados.
- El recibo de Stripe es un comprobante de pago; no sustituye un CFDI ni activa correos de cotizaciones, citas o reportes. No se habilita `invoice_creation`.

### Aviso completo al vendedor por Cloudflare

- Destinatario autorizado: `maquinariarenteria17@gmail.com`. Remitente: `ventas@maquinaria-renteria.com`. Los envíos a este destino verificado son gratuitos con la cuenta existente de Cloudflare; no se activa el plan de pago para enviar a destinatarios arbitrarios.
- Configurar el dominio en Email Service y verificar el destinatario mediante «Verify email address». `send_email` vincula `ORDER_EMAIL` al Worker, restringido al destinatario y remitente indicados. Configurar `ORDER_NOTIFICATION_ENABLED=true`, `ORDER_NOTIFICATION_TO` y `ORDER_NOTIFICATION_FROM`. No se usa una clave API ni un endpoint público para enviar correos arbitrarios.
- Aplicar `migrations/0004_order_email_notifications.sql` antes del despliegue. El pago confirmado y su aviso pendiente se escriben juntos mediante una transacción D1. El pedido sigue apareciendo en Ventas aunque el proveedor falle.
- El webhook firmado y la consulta verificada de Stripe comparten la confirmación de pago. No se envían avisos de pagos pendientes, fallidos, manipulados o cancelados. Eventos repetidos y concurrentes no duplican el aviso. No se envían automáticamente las compras antiguas que ya estaban pagadas antes de esta migración.
- Se incluye folio, fecha, nombre, teléfono, correo, dirección, ciudad, estado, código postal, equipos y variantes, SKU, cantidades, precios, subtotal, IVA, total, importe pagado, saldo, flete por coordinar, factura solicitada, RFC, razón social y referencias Stripe. Las simulaciones se identifican con `[PRUEBA]`. No se incluyen claves, tokens de acceso ni datos de tarjeta. El contenido HTML se escapa y Reply-To permite responder al cliente.
- Se intenta enviar en segundo plano con `waitUntil`. Un rechazo explícito por límite de peticiones o por falta de verificación conserva el aviso pendiente; se reintenta cada 15 minutos con espera creciente. El contenido, destinatario y remitente se conservan en cada aviso. Si la entrega queda incierta por una interrupción, queda para revisión y no se reenvía automáticamente, para evitar duplicados.
- En Salud de la web se muestran conexión, avisos aceptados, pendientes, pendientes de verificación y avisos que requieren revisión. El botón de prueba requiere sesión de administrador y permite tres envíos por hora para este proveedor. No crea ventas ni cobra. Una prueba aceptada permite reintentar los avisos pendientes de verificación.
- `sent` significa que Cloudflare devolvió un identificador de aceptación, no que se verificó la llegada a la bandeja de entrada. Comprobar el correo de prueba y el de una compra simulada en la bandeja de entrada o spam antes de dar por terminada la activación.

Fuentes del proveedor: https://developers.cloudflare.com/email-service/platform/pricing/ ; https://developers.cloudflare.com/email-service/api/send-emails/workers-api/ ; https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/

Fuentes: https://docs.stripe.com/receipts ; https://docs.stripe.com/api/checkout/sessions/create ; https://support.stripe.com/questions/set-up-account-email-notifications

## Fuentes del plan

- https://docs.stripe.com/payments/accept-a-payment?payment-ui=checkout&ui=stripe-hosted
- https://docs.stripe.com/webhooks
- https://docs.stripe.com/keys/restricted-api-keys
- https://docs.stripe.com/sandboxes
