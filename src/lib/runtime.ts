export interface PickedLocalFile {
  id: string
  name: string
  path?: string
  file?: File
  mimeType: string
  size: number
}

export type AttachmentPickKind = 'image' | 'document' | 'video'

const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'txt', 'md', 'rtf', 'json', 'xml', 'html', 'htm']

export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return Boolean((window as typeof window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
}

export function normalizeServerUrl(url: string): string {
  return String(url || '').trim().replace(/\/$/, '')
}

export function withBasePath(serverUrl: string, path: string): string {
  const base = normalizeServerUrl(serverUrl)
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

export function safeErrorMessage(error: unknown, fallback = '请求失败'): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error.trim()) {
    return error
  }
  return fallback
}

export function basename(path: string): string {
  return String(path || '').split(/[/\\]/).filter(Boolean).pop() || 'file'
}

export function extensionFromName(name: string) {
  const value = String(name || '').trim().toLowerCase()
  const index = value.lastIndexOf('.')
  return index >= 0 ? value.slice(index + 1) : ''
}

export function detectAttachmentKind(name: string, mimeType = ''): AttachmentPickKind {
  const mime = String(mimeType || '').toLowerCase()
  const ext = extensionFromName(name)

  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic'].includes(ext)) {
    return 'image'
  }

  if (mime.startsWith('video/') || ['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv'].includes(ext)) {
    return 'video'
  }

  return 'document'
}

function pickDialogConfig(kind: AttachmentPickKind) {
  if (kind === 'image') {
    return {
      title: '选择图片',
      filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic'] }],
      accept: 'image/*',
    }
  }

  if (kind === 'video') {
    return {
      title: '选择视频',
      filters: [{ name: '视频', extensions: ['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv'] }],
      accept: 'video/*,.mp4,.mov,.m4v,.webm,.avi,.mkv',
    }
  }

  return {
    title: '选择文档',
    filters: [{ name: '文档', extensions: DOCUMENT_EXTENSIONS }],
    accept: DOCUMENT_EXTENSIONS.map(ext => `.${ext}`).join(','),
  }
}

export async function pickLocalFiles(kind: AttachmentPickKind = 'document'): Promise<PickedLocalFile[]> {
  const config = pickDialogConfig(kind)

  if (isTauriRuntime()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({
      multiple: true,
      directory: false,
      title: config.title,
      filters: config.filters,
    })

    if (!selected) {
      return []
    }

    const paths = Array.isArray(selected) ? selected : [selected]
    return paths.map(path => ({
      id: `path-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: basename(path),
      path,
      mimeType: '',
      size: 0,
    }))
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = config.accept
    input.onchange = () => {
      const files = Array.from(input.files || [])
      resolve(files.map(file => ({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        file,
        mimeType: file.type || '',
        size: file.size,
      })))
    }
    input.click()
  })
}
