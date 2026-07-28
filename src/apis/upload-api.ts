import http from './http'

// React Native's FormData takes a {uri, name, type} descriptor rather than a
// web File; the native layer streams the file off disk from that uri.
export interface UploadableImage {
  uri: string
  name?: string | null
  mimeType?: string | null
}

const EXTENSION_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

// Without a real mime the backends see application/octet-stream and reject it.
function mimeOf(image: UploadableImage): string {
  if (image.mimeType) return image.mimeType
  const ext = image.uri.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_MIME[ext] ?? 'image/jpeg'
}

const uploadApi = {
  uploadImage: (image: UploadableImage) => {
    const type = mimeOf(image)
    const form = new FormData()
    form.append('file', {
      uri: image.uri,
      name: image.name ?? `upload.${type.split('/')[1]}`,
      type,
    } as unknown as Blob)
    // Content-Type is left undefined on purpose: the instance default is
    // application/json, and only the platform can add the multipart boundary.
    return http.post('/uploads/image', form, {
      headers: { 'Content-Type': undefined },
    })
  },
}

export default uploadApi
