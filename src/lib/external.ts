import { invoke } from '@tauri-apps/api/core'
import { isTauriRuntime } from './runtime'

export async function openExternalUrl(url: string) {
  const target = String(url || '').trim()
  if (!target) {
    return
  }

  if (isTauriRuntime()) {
    await invoke('open_external', {
      request: { url: target },
    })
    return
  }

  window.open(target, '_blank', 'noopener,noreferrer')
}
