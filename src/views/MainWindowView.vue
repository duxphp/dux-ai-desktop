<script setup lang="ts">
import { IconEdit, IconInfoCircle, IconTrash, IconSettings } from '@tabler/icons-vue'
import { computed, onMounted, ref } from 'vue'
import ChatPanel from '../components/ChatPanel.vue'
import DesktopWindowControls from '../components/DesktopWindowControls.vue'
import WindowSidebar from '../components/WindowSidebar.vue'
import { openChildWindow } from '../lib/app-windows'
import { isMacLike, startWindowDragging } from '../lib/window'
import { useChatStore } from '../stores/chat'
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()
const chat = useChatStore()

const ready = computed(() => settings.ready)
const configured = computed(() => settings.configured)
const booting = computed(() => chat.booting)
const activeSession = computed(() => chat.activeSession)
const rootClass = computed(() => isMacLike ? 'p-0' : 'p-1.5')
const shellClass = computed(() => isMacLike
  ? 'mac-native-shell rounded-none border-0 shadow-none'
  : 'rounded-[32px] border border-[color:var(--app-border)]')

const renameOpen = ref(false)
const deleteOpen = ref(false)
const renameValue = ref('')
const actionBusy = ref(false)

async function bootstrap(force = false) {
  if (!settings.configured) {
    await openChildWindow('settings')
    return
  }
  await chat.bootstrap(force)
}

async function openSettingsWindow() {
  await openChildWindow('settings')
}

async function openAboutWindow() {
  await openChildWindow('about')
}

function handleHeaderMouseDown(event: MouseEvent) {
  if (event.button !== 0) {
    return
  }
  const target = event.target as HTMLElement | null
  if (target?.closest('.no-drag')) {
    return
  }
  void startWindowDragging()
}

function openRenameDialog() {
  if (!activeSession.value) {
    return
  }
  renameValue.value = String(activeSession.value.title || '')
  renameOpen.value = true
}

function openDeleteDialog() {
  if (!activeSession.value) {
    return
  }
  deleteOpen.value = true
}

async function confirmRename() {
  const title = renameValue.value.trim()
  if (!activeSession.value || !title) {
    return
  }
  actionBusy.value = true
  try {
    await chat.renameSession({ id: activeSession.value.id, title })
    renameOpen.value = false
  }
  finally {
    actionBusy.value = false
  }
}

async function confirmDelete() {
  if (!activeSession.value) {
    return
  }
  actionBusy.value = true
  try {
    await chat.deleteSession(activeSession.value.id)
    deleteOpen.value = false
  }
  finally {
    actionBusy.value = false
  }
}

onMounted(async () => {
  await settings.init()
  await bootstrap()
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-transparent text-app-text" :class="rootClass">
    <div
      v-if="!isMacLike"
      class="pointer-events-none absolute inset-0"
      :style="{
        background: 'radial-gradient(circle at 12% 18%, var(--app-glow-a), transparent 24%), radial-gradient(circle at 88% 14%, var(--app-glow-b), transparent 22%), radial-gradient(circle at 50% 100%, var(--app-glow-c), transparent 30%)'
      }"
    />

    <div class="glass-shell relative flex h-full w-full flex-col overflow-hidden" :class="shellClass">
      <header
        v-if="isMacLike"
        class="relative h-[40px] shrink-0"
        data-tauri-drag-region
        @mousedown="handleHeaderMouseDown"
      >
        <div class="no-drag absolute right-3 top-3 z-20 flex items-center gap-2">
          <button class="btn-ghost" aria-label="打开关于" @click="openAboutWindow">
            <IconInfoCircle class="h-5.5 w-5.5" stroke="1.85" />
          </button>
          <button class="btn-ghost" aria-label="打开设置" @click="openSettingsWindow">
            <IconSettings class="h-5.5 w-5.5" stroke="1.85" />
          </button>
        </div>
      </header>

      <header
        v-else
        class="relative flex h-[38px] shrink-0 items-center justify-between px-3"
        data-tauri-drag-region
        @mousedown="handleHeaderMouseDown"
      >
        <div class="min-w-0" data-tauri-drag-region>
          <div class="truncate text-sm font-semibold text-[color:var(--app-text)]">Dux AI</div>
        </div>
        <div class="flex items-center gap-1 no-drag" data-tauri-drag-region>
          <button class="btn-ghost flex h-8 w-8 items-center justify-center" aria-label="打开关于" @click="openAboutWindow">
            <IconInfoCircle class="h-5 w-5" stroke="1.9" />
          </button>
          <button class="btn-ghost flex h-8 w-8 items-center justify-center" aria-label="打开设置" @click="openSettingsWindow">
            <IconSettings class="h-5 w-5" stroke="1.9" />
          </button>
          <DesktopWindowControls compact />
        </div>
      </header>

      <div class="grid min-h-0 flex-1 grid-cols-[290px_minmax(0,1fr)] overflow-hidden">
        <div class="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <WindowSidebar
            :sessions="chat.sessions"
            :agents="chat.agents"
            :active-session-id="chat.activeSessionId"
            :active-agent-code="chat.activeAgentCode"
            :loading="booting"
            :configured="configured"
            @create-session="chat.createSession"
            @select-session="chat.selectSession"
            @select-agent="chat.selectAgent"
            @open-settings="openSettingsWindow"
          />
        </div>

        <div class="flex min-h-0 min-w-0 flex-col overflow-hidden pt-2 pr-4 pb-4">
          <div class="chat-canvas flex h-full min-h-0 flex-col overflow-hidden rounded-[12px]">
            <ChatPanel
              :ready="ready"
              :configured="configured"
              :booting="booting"
              :active-agent="chat.activeAgent"
              :active-session="chat.activeSession"
              :messages="chat.messages"
              :pending-attachments="chat.pendingAttachments"
              :sending="chat.sending"
              :uploading="chat.uploading"
              :error="chat.error"
              @send="chat.sendMessage"
              @cancel="chat.cancelCurrentStream"
              @attach="chat.pickAndUploadFile"
              @retry-bootstrap="bootstrap(true)"
              @request-rename="openRenameDialog"
              @request-delete="openDeleteDialog"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="renameOpen" class="no-drag absolute inset-0 z-40 grid place-items-center bg-black/28 backdrop-blur-sm">
      <div class="dialog-panel w-full max-w-md rounded-[20px] px-5 py-5">
        <div class="text-app text-lg font-semibold">重命名会话</div>
        <p class="text-app-muted mt-2 text-sm">输入新的会话名称。</p>
        <input
          v-model="renameValue"
          class="field-base mt-4 w-full rounded-2xl px-4 py-3 text-sm"
          placeholder="例如：需求讨论"
          @keydown.enter.prevent="confirmRename"
        >
        <div class="mt-5 flex justify-end gap-3">
          <button class="dialog-btn-muted" @click="renameOpen = false">取消</button>
          <button class="dialog-btn-accent disabled:opacity-55" :disabled="!renameValue.trim() || actionBusy" @click="confirmRename">确认</button>
        </div>
      </div>
    </div>

    <div v-if="deleteOpen" class="no-drag absolute inset-0 z-40 grid place-items-center bg-black/28 backdrop-blur-sm">
      <div class="dialog-panel w-full max-w-md rounded-[20px] px-5 py-5">
        <div class="text-app text-lg font-semibold">删除会话</div>
        <p class="text-app-muted mt-2 text-sm">确认删除“{{ activeSession?.title || '未命名会话' }}”吗？删除后无法恢复。</p>
        <div class="mt-5 flex justify-end gap-3">
          <button class="dialog-btn-muted" @click="deleteOpen = false">取消</button>
          <button class="dialog-btn-danger disabled:opacity-55" :disabled="actionBusy" @click="confirmDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>
