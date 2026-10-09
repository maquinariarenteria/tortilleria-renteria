# Seguridad y operación

El sitio usa React/Vite, Cloudflare Workers, D1 y Stripe Checkout con pago completo. Los secretos viven en Cloudflare; no deben incluirse en el repositorio, bundles o variables VITE_. Stripe sigue en pruebas hasta sustituir las credenciales y verificar los cobros reales.

## Verificación y despliegue

`npm ci` instala el lockfile. `npm run check` ejecuta pruebas de pagos, regresiones de seguridad y compilación. Wrangler ejecuta esta verificación antes de desplegar. Las pruebas usan SQLite aislado y un transporte Stripe ficticio; no cobran ni envían correos. No sustituyen un pentest independiente o pruebas con dispositivos físicos.

Antes de desplegar esta versión, aplicar `migrations/0003_security.sql` en la D1 correspondiente. La migración es aditiva. Conserva el ledger y las tablas antiguas. El catálogo, la configuración, las citas y cotizaciones nuevas se guardan en `app_records`; los pagos verificados permanecen en `stripe_orders`. El catálogo inicial procede del código hasta guardar una edición desde el administrador.

Los datos antiguos de citas y cotizaciones de un administrador se importan al entrar. Registros inválidos se conservan en el almacenamiento antiguo del navegador para revisión. No se contabilizan las consultas de WhatsApp como ventas pagadas. El contacto y las solicitudes de cita se guardan en D1; el envío automático de correos no está configurado.

## Controles

Cada API administrativa comprueba una sesión firmada y su registro de servidor. Cookie `__Host-mr_admin`, Secure, HttpOnly y SameSite=Strict. Duración máxima de 8 horas y 30 minutos sin peticiones autenticadas. El cierre de sesión revoca el registro. Las sesiones antiguas todavía válidas se migran una vez. No hay cuentas por rol, MFA propio o recuperación automatizada de contraseña.

Las escrituras del navegador requieren el origen canónico. Login, contacto y checkout admiten 10 intentos por IP cada 10 minutos. Este límite puede afectar a clientes de una misma red; revisar con tráfico real y complementar con WAF/Turnstile si corresponde. Los webhooks usan firma Stripe, sin depender del origen ni de ese límite.

Los precios, cantidades, moneda e importes se comprueban en el servidor. Se conserva el pedido original. Un intento de checkout reutiliza su referencia e idempotency key. Solo la confirmación verificable de Stripe cambia el pago a `paid`. Eventos repetidos no duplican pedidos y fallos D1 producen respuestas que permiten reintentos Stripe.

Las respuestas de API privada usan no-store. El sitio incluye CSP, HSTS, nosniff, bloqueo de frames y política de referencias. `_headers` protege los archivos estáticos. `workers.dev` y previews se desactivan en Wrangler. Observabilidad habilitada con muestreo del 10%. No registrar datos de clientes, cookies, claves o cuerpos de webhooks.

## Recuperación

Antes de cada migración registrar un bookmark D1. Time Travel permite restauración dentro de la ventana del plan. Mantener además exportaciones SQL fuera de Git y acceso limitado. Ensayar una restauración en una base separada y validar conteos, pagos y permisos antes de depender de ese procedimiento. Nunca restaurar producción sin coordinar los pedidos posteriores al bookmark. La prueba local de restauración no certifica una recuperación remota de D1.

La limpieza administrativa elimina únicamente sesiones y contadores vencidos. Las cotizaciones y citas se borran lógicamente (`deleted_at`). Para recuperar un registro específico, un operador autorizado puede establecer ese campo a NULL mediante una consulta parametrizada por kind e id; registrar la operación. No purgar la auditoría para liberar espacio.

## Pendientes antes de cobros reales

Rotar cualquier token compartido en conversaciones, reducir permisos y activar MFA/passkeys en las cuentas que controlan la tienda. Revisar dominio/renovación, restricciones de rama, claves live restringidas y webhook live separado. Probar compra real de importe aprobado y reembolso; conciliar Stripe con D1. Reembolsos y disputas se gestionan en Stripe: todavía no sincronizan automáticamente un estado de reembolso en la tienda.

Configurar el correo transaccional y R2 si se necesitan. Revisar aviso de privacidad, términos, devolución/garantía, facturación e IVA con el responsable del negocio. Validar testimonios y promesas comerciales. Las analíticas A/B globales no están configuradas. Medir Core Web Vitals con usuarios reales, probar Safari/móviles físicos y completar revisión independiente antes de declarar cumplimiento ASVS.

Quedan avisos de npm en dependencias de compilación de Tailwind 3; registrar la excepción y migrar a una versión corregida cuando haya una solución compatible. La auditoría de dependencias runtime debe ejecutarse nuevamente antes del lanzamiento.
