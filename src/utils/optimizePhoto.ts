// Convert on the administrator's device before sending bytes to the server.
export async function optimizePhoto(file: File): Promise<File> {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 20000000) throw new Error('Selecciona una foto JPG, PNG o WebP de hasta 20 MB.');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { throw new Error('No se pudo abrir la imagen. Prueba con otra foto JPG, PNG o WebP.'); }
  const canvas = document.createElement('canvas');
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 50000000) throw new Error('La foto es demasiado grande. Reduce su resolución e inténtalo de nuevo.');
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('El navegador no pudo optimizar la imagen.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.84));
    if (!blob || blob.type !== 'image/webp') throw new Error('Este navegador no permite convertir a WebP. Prueba con Chrome actualizado.');
    if (blob.size > 5000000) throw new Error('La foto optimizada supera 5 MB. Selecciona una imagen más pequeña.');
    return new File([blob], file.name.replace(/\.[^.]*$/, '') + '.webp', { type: 'image/webp' });
  } finally { bitmap.close(); canvas.width = 0; canvas.height = 0; }
}
