import { invoke } from '@tauri-apps/api/core'
import { loadSettings } from './settings-repository'
import { isTauriRuntime, normalizeServerUrl } from './runtime'

interface DownloadRemoteAssetOptions {
  url: string
  filename?: string
  mimeType?: string
}

function extensionFromMime(mimeType?: string) {
  const mime = String(mimeType || '').toLowerCase()
  if (!mime) {
    return ''
  }
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
  }
  return map[mime] || mime.split('/')[1] || ''
}

function filenameFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const value = parsed.pathname.split('/').filter(Boolean).pop() || ''
    return decodeURIComponent(value)
  }
  catch {
    return ''
  }
}

function normalizeFilename(input: string, mimeType?: string) {
  const raw = String(input || '').trim().replace(/[\\/:*?"<>|]/g, '-')
  if (!raw) {
    const ext = extensionFromMime(mimeType)
    return ext ? `media.${ext}` : 'media'
  }
  if (raw.includes('.')) {
    return raw
  }
  const ext = extensionFromMime(mimeType)
  return ext ? `${raw}.${ext}` : raw
}

function isSameServerAsset(url: string, serverUrl: string) {
  const base = normalizeServerUrl(serverUrl)
  if (!base) {
    return false
  }
  return url.startsWith(base)
}

export async function downloadRemoteAsset(options: DownloadRemoteAssetOptions) {
  const url = String(options.url || '').trim()
  if (!url) {
    return false
  }

  const defaultName = normalizeFilename(options.filename || filenameFromUrl(url), options.mimeType)

  if (isTauriRuntime()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const ext = defaultName.includes('.') ? defaultName.split('.').pop() || '' : extensionFromMime(options.mimeType)
    const savePath = await save({
      title: '保存文件',
      defaultPath: defaultName,
      filters: ext ? [{ name: '文件', extensions: [ext] }] : undefined,
    })

    if (!savePath) {
      return false
    }

    const settings = await loadSettings()
    const token = isSameServerAsset(url, settings.serverUrl) ? settings.token : ''

    await invoke('download_remote_asset', {
      request: {
        url,
        savePath,
        token,
      },
    })
    return true
  }

  const link = document.createElement('a')
  link.href = url
  link.download = defaultName
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
  return true
}
