/**
 * Shrinks a photo in the browser before upload: max 1600 px on the long edge, JPEG at 82%.
 * Two reasons: hosting caps request sizes, and re-encoding through a canvas drops all EXIF data,
 * including any GPS location, so the visitor's photo cannot leak where they live.
 */
export async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Photos must be JPEG, PNG or WebP.')
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('That image could not be read.')
  })
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Your browser cannot process images.')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) throw new Error('That image could not be processed.')
  const name = file.name.replace(/\.[^.]+$/, '') || 'photo'
  return new File([blob], `${name}.jpg`, {type: 'image/jpeg'})
}
