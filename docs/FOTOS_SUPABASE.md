# Fotos del catálogo

El proyecto `renteria-fotos` de Supabase Free almacena únicamente fotos y sus
asignaciones a máquinas. Los precios, clientes, pedidos y sesiones siguen en D1.
Stripe y los correos de compra mantienen su configuración en Cloudflare.

## Configuración

- Proyecto: `hktthpvdbyewfgqvuiek`.
- URL: `https://hktthpvdbyewfgqvuiek.supabase.co`.
- Bucket privado: `renteria-fotos`; PNG/JPEG/WebP hasta 5 MB.
- Tabla: `public.catalog_photos`, RLS activado y sin acceso de anon/authenticated.
- SQL de instalación: `docs/supabase-fotos.sql`; se ejecuta en Supabase, no D1.
- Worker: `SUPABASE_URL` y `SUPABASE_MEDIA_BUCKET` son configuración pública;
  `SUPABASE_SECRET_KEY` es un secreto cifrado de Cloudflare, exclusivo del servidor.
  No debe aparecer en React, GitHub, capturas ni documentación de accesos.

El bucket es privado: el Worker entrega las fotos de productos en `/media/catalog/…`.
Estas fotos sí son visibles públicamente en la tienda, mediante esa ruta. Las claves
de Supabase y sus respuestas administrativas nunca se envían al navegador del cliente.
Las fotos ya publicadas como archivos `/images/…` permanecen disponibles en Cloudflare.
Las ocho fotos principales se migraron a WebP en Supabase. Inicio, proceso de
producción, ventajas y sectores reutilizan la foto vigente de cada máquina del
catálogo. Los originales estáticos se conservan como respaldo y como imagen
inicial mientras se consulta el catálogo.

## Uso

1. Administrador → Catálogo → Editar Ficha → Seleccionar archivo local.
2. Esperar a que termine la subida y pulsar Guardar en Catálogo para publicar.
3. Sincronizar fotos consulta las asignaciones en la tabla de Supabase y actualiza
   únicamente las imágenes del catálogo D1. No cambia precios ni fichas técnicas.
4. El resultado muestra fotos registradas, cambios aplicados y última sincronización.
   Una tabla vacía no borra las imágenes existentes. Ante un fallo, no se registra éxito.

Las nuevas fotos se convierten a WebP en el navegador antes de enviarse. Se admite
un original de hasta 20 MB, se conserva su proporción, orientación y transparencia,
y se reduce el lado mayor a 1800 píxeles como máximo, calidad 84 %. El servidor
recibe como máximo 5 MB y vuelve a validar el formato y la sesión administrativa.

Subir una imagen y cancelar la edición no la publica. El archivo subido puede quedar
sin asignar y seguir ocupando espacio; no se borra automáticamente. Reutilizar una
foto requiere elegirla y guardar su ficha; reemplazarla genera una ruta nueva para
evitar problemas de caché. No se eliminan automáticamente archivos antiguos.

## Actividad y pausas

El botón realiza una consulta real a la base de datos y, al guardar cambios de fotos,
se actualizan sus asignaciones. No hay cron ni tráfico artificial para impedir pausas.
El plan Free puede pausar proyectos con poca actividad durante siete días; una
sincronización semanal no garantiza evitarlo. Si llega una advertencia, revisar el
proyecto en Supabase. Si ya está pausado, usar Resume project en su Dashboard.
Las nuevas fotos alojadas allí pueden dejar de responder mientras esté pausado.

Documentación: https://supabase.com/docs/guides/platform/free-project-pausing

## Validación

`npm run check` verifica pagos/correo, sincronización, permisos, tipos de archivo,
fallos de Supabase, conservación de precios y conflictos con ediciones concurrentes.
No realiza cobros ni envíos reales durante las pruebas locales.
