import { computed, ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<ToastItem[]>([])
let seed = 0

export function pushToast(message: string, type: ToastType = 'info', duration = 2200) {
  const text = String(message || '').trim()
  if (!text) {
    return
  }

  const existing = toasts.value.find(item => item.message === text && item.type === type)
  if (existing) {
    removeToast(existing.id)
  }

  const id = ++seed
  toasts.value = [...toasts.value, { id, message: text, type }]
  window.setTimeout(() => {
    removeToast(id)
  }, duration)
}

export function removeToast(id: number) {
  toasts.value = toasts.value.filter(item => item.id !== id)
}

export function useToasts() {
  return {
    toasts: computed(() => toasts.value),
    removeToast,
    pushToast,
  }
}
