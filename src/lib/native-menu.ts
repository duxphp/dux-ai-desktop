import { openChildWindow, resolveWindowKind } from './app-windows'
import { openExternalUrl } from './external'
import { isTauriRuntime } from './runtime'

export interface NativeContextMenuAction {
  text?: string
  enabled?: boolean
  accelerator?: string
  type?: 'item' | 'separator'
  action?: () => void | Promise<void>
}

let appMenuReady: Promise<void> | null = null

function isMacPlatform() {
  if (typeof navigator === 'undefined') {
    return false
  }
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
}

async function copyText(text: string) {
  const value = String(text || '').trim()
  if (!value) {
    return
  }
  await navigator.clipboard.writeText(value)
}

async function pasteTextToElement(element: HTMLInputElement | HTMLTextAreaElement) {
  const text = await navigator.clipboard.readText()
  const start = element.selectionStart ?? element.value.length
  const end = element.selectionEnd ?? element.value.length
  element.focus()
  element.setRangeText(text, start, end, 'end')
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

function getEditableElement(target: EventTarget | null) {
  return target instanceof HTMLElement ? target.closest('input, textarea, [contenteditable="true"]') as HTMLElement | null : null
}

function getInputSelectionText(element: HTMLInputElement | HTMLTextAreaElement) {
  const start = element.selectionStart ?? 0
  const end = element.selectionEnd ?? 0
  if (end <= start) {
    return ''
  }
  return String(element.value || '').slice(start, end).trim()
}

export function getSelectedTextWithin(container: HTMLElement | null) {
  if (!container || typeof window === 'undefined') {
    return ''
  }

  const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null
  if (active && container.contains(active) && typeof active.selectionStart === 'number' && typeof active.selectionEnd === 'number') {
    return getInputSelectionText(active)
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return ''
  }

  const anchorNode = selection.anchorNode
  const focusNode = selection.focusNode
  if (!anchorNode || !focusNode) {
    return ''
  }

  if (!container.contains(anchorNode) || !container.contains(focusNode)) {
    return ''
  }

  return selection.toString().trim()
}

export function isEditableContextTarget(target: EventTarget | null) {
  return Boolean(getEditableElement(target))
}

export async function copySelectedTextWithin(container: HTMLElement | null) {
  const text = getSelectedTextWithin(container)
  if (!text) {
    return false
  }
  await copyText(text)
  return true
}

export async function showNativeContextMenu(event: MouseEvent, actions: NativeContextMenuAction[]) {
  if (!isTauriRuntime() || !actions.length) {
    return
  }

  const [{ Menu, MenuItem, PredefinedMenuItem }, { LogicalPosition }, { getCurrentWindow }] = await Promise.all([
    import('@tauri-apps/api/menu'),
    import('@tauri-apps/api/dpi'),
    import('@tauri-apps/api/window'),
  ])

  const resources: Array<{ close: () => Promise<void> }> = []
  const items = []

  for (const action of actions) {
    if (action.type === 'separator') {
      const separator = await PredefinedMenuItem.new({ item: 'Separator' })
      resources.push(separator)
      items.push(separator)
      continue
    }

    const item = await MenuItem.new({
      text: action.text || '',
      enabled: action.enabled ?? true,
      accelerator: action.accelerator,
      action: () => {
        void action.action?.()
      },
    })
    resources.push(item)
    items.push(item)
  }

  const menu = await Menu.new({ items })

  try {
    await menu.popup(new LogicalPosition(event.clientX, event.clientY), getCurrentWindow())
  }
  finally {
    await Promise.allSettled([
      menu.close(),
      ...resources.map(item => item.close()),
    ])
  }
}

export async function showEditableContextMenu(event: MouseEvent) {
  const editable = getEditableElement(event.target)
  if (!editable) {
    return false
  }

  const isInputLike = editable instanceof HTMLInputElement || editable instanceof HTMLTextAreaElement
  const selectionText = isInputLike
    ? getInputSelectionText(editable)
    : window.getSelection()?.toString().trim() || ''
  const readOnly = editable.hasAttribute('readonly') || editable.getAttribute('aria-readonly') === 'true'
  const disabled = editable.hasAttribute('disabled') || editable.getAttribute('aria-disabled') === 'true'
  const valueLength = isInputLike ? String(editable.value || '').length : String(editable.textContent || '').length

  event.preventDefault()
  event.stopPropagation()

  await showNativeContextMenu(event, [
    {
      text: '撤销',
      enabled: !disabled && !readOnly,
      action: async () => {
        editable.focus()
        document.execCommand('undo')
      },
    },
    {
      text: '重做',
      enabled: !disabled && !readOnly,
      action: async () => {
        editable.focus()
        document.execCommand('redo')
      },
    },
    { type: 'separator' },
    {
      text: '剪切',
      enabled: !disabled && !readOnly && !!selectionText,
      action: async () => {
        editable.focus()
        document.execCommand('cut')
      },
    },
    {
      text: '复制',
      enabled: !!selectionText,
      action: async () => {
        editable.focus()
        document.execCommand('copy')
      },
    },
    {
      text: '粘贴',
      enabled: !disabled && !readOnly,
      action: async () => {
        if (isInputLike) {
          await pasteTextToElement(editable)
          return
        }
        editable.focus()
        document.execCommand('paste')
      },
    },
    { type: 'separator' },
    {
      text: '全选',
      enabled: valueLength > 0,
      action: async () => {
        editable.focus()
        if (isInputLike) {
          editable.select()
          return
        }
        document.execCommand('selectAll')
      },
    },
  ])

  return true
}

export async function setupNativeAppMenu() {
  if (!isTauriRuntime() || !isMacPlatform() || resolveWindowKind() !== 'main') {
    return
  }
  if (appMenuReady) {
    return appMenuReady
  }

  appMenuReady = (async () => {
    const { Menu, Submenu, MenuItem, PredefinedMenuItem } = await import('@tauri-apps/api/menu')

    const appSubmenu = await Submenu.new({
      text: 'Dux AI',
      items: [
        await MenuItem.new({ text: '关于 Dux AI', action: () => void openChildWindow('about') }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await MenuItem.new({ text: '设置…', accelerator: 'CmdOrCtrl+,', action: () => void openChildWindow('settings') }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await PredefinedMenuItem.new({ item: 'Services', text: '服务' }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await PredefinedMenuItem.new({ item: 'Hide', text: '隐藏 Dux AI' }),
        await PredefinedMenuItem.new({ item: 'HideOthers', text: '隐藏其他' }),
        await PredefinedMenuItem.new({ item: 'ShowAll', text: '显示全部' }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await PredefinedMenuItem.new({ item: 'Quit', text: '退出 Dux AI' }),
      ],
    })

    const editSubmenu = await Submenu.new({
      text: '编辑',
      items: [
        await PredefinedMenuItem.new({ item: 'Undo', text: '撤销' }),
        await PredefinedMenuItem.new({ item: 'Redo', text: '重做' }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await PredefinedMenuItem.new({ item: 'Cut', text: '剪切' }),
        await PredefinedMenuItem.new({ item: 'Copy', text: '复制' }),
        await PredefinedMenuItem.new({ item: 'Paste', text: '粘贴' }),
        await PredefinedMenuItem.new({ item: 'SelectAll', text: '全选' }),
      ],
    })

    const windowSubmenu = await Submenu.new({
      text: '窗口',
      items: [
        await PredefinedMenuItem.new({ item: 'Minimize', text: '最小化' }),
        await PredefinedMenuItem.new({ item: 'Maximize', text: '缩放' }),
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await PredefinedMenuItem.new({ item: 'CloseWindow', text: '关闭窗口' }),
      ],
    })

    const helpSubmenu = await Submenu.new({
      text: '帮助',
      items: [
        await MenuItem.new({ text: 'Dux 官网', action: () => void openExternalUrl('https://www.dux.cn') }),
        await MenuItem.new({ text: 'GitHub 仓库', action: () => void openExternalUrl('https://github.com/duxweb/dux-ai') }),
      ],
    })

    await Promise.allSettled([
      windowSubmenu.setAsWindowsMenuForNSApp(),
      helpSubmenu.setAsHelpMenuForNSApp(),
    ])

    const menu = await Menu.new({
      items: [appSubmenu, editSubmenu, windowSubmenu, helpSubmenu],
    })

    await menu.setAsAppMenu()
  })()

  return appMenuReady
}
