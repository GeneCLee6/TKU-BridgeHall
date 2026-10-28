import { accountApi, FILE_LIMITS, FILE_TYPES, type FilePurpose, type FileType, type UploadedFile } from './account.ts'
import { canvasEncoder, encodeAvatar, type Size } from './avatarImage.ts'

/**
 * Uploading a picture for a post or an article (e11-t02; the forum's compose box, e11-t13, and
 * E5's articles use it). The browser does the image work, the Worker only checks size and type:
 * the picture is shrunk to a long side of `FILE_LIMITS.pixels` and its thumbnail to
 * `thumbPixels`, each written as WebP (JPEG where the browser cannot) at a quality that fits; then
 * a single-use pass, and the two `PUT`s (TKU-BridgeTable `shared/files.ts`).
 */

/** The size that fits within `max` on its long side, never larger than the original */
export function fitWithin(size: Size, max: number): Size {
  const scale = Math.min(1, max / Math.max(size.width, size.height))
  return { width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) }
}

export const isUploadType = (type: string): type is FileType => (FILE_TYPES as readonly string[]).includes(type)

/** The picture redrawn within `max` pixels and `maxBytes`; null when nothing fits */
async function shrink(image: ImageBitmap, max: number, maxBytes: number): Promise<Blob | null> {
  const { width, height } = fitWithin(image, max)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, width, height)
  return encodeAvatar(canvasEncoder(canvas), maxBytes)
}

/** The pass and the two uploads, for a picture and thumbnail already made */
export async function uploadPrepared(picture: Blob, thumb: Blob | null, purpose: FilePurpose): Promise<UploadedFile> {
  if (!isUploadType(picture.type)) throw new TypeError(picture.type)
  const ticket = await accountApi.files.ticket({ purpose, type: picture.type, size: picture.size })
  const file = await accountApi.files.put(ticket.uploadUrl, picture)
  return thumb ? accountApi.files.put(ticket.thumbUrl, thumb) : file
}

/**
 * Shrinks a picture the member picked and uploads it with its thumbnail. Throws a TypeError for a
 * file that is not a JPEG, PNG or WebP or cannot be read, and the API's errors as they come
 */
export async function uploadImage(file: File, purpose: FilePurpose): Promise<UploadedFile> {
  if (!isUploadType(file.type)) throw new TypeError(file.type)
  const image = await createImageBitmap(file)
  try {
    const picture = await shrink(image, FILE_LIMITS.pixels, FILE_LIMITS.maxBytes)
    if (!picture) throw new TypeError(file.type)
    const thumb = await shrink(image, FILE_LIMITS.thumbPixels, FILE_LIMITS.thumbMaxBytes)
    return await uploadPrepared(picture, thumb, purpose)
  } finally {
    image.close()
  }
}
