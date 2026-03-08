<script setup lang="ts">
import { IconEdit, IconTrash } from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
  ready: boolean
  configured: boolean
  booting: boolean
  activeAgent: any | null
  activeSession: any | null
  messages: any[]
  pendingAttachments: any[]
  sending: boolean
  uploading: boolean
  error: string
}>()

const emit = defineEmits<{
  send: [text: string]
  cancel: []
  attach: []
  retryBootstrap: []
  requestRename: []
  requestDelete: []
}>()

const draft = ref('')
const headerTitle = computed(() => props.activeSession?.title || props.activeAgent?.name || '新会话')
const canSend = computed(() => props.configured && props.ready && !props.sending && (draft.value.trim().length > 0 || props.pendingAttachments.length > 0))

function submit() {
  const text = draft.value
  if (!text.trim() && !props.pendingAttachments.length) {
    return
  }
  emit('send', text)
  draft.value = ''
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <section class="flex h-full min-h-0 flex-col p-4">
    <header class="shrink-0 border-b border-app pb-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="text-app mt-1 truncate text-xl font-semibold">{{ headerTitle }}</div>
        </div>
        <div class="no-drag flex shrink-0 items-center gap-2">
          <button
            v-if="activeSession"
            class="btn-muted inline-flex h-9 w-9 items-center justify-center rounded-full"
            aria-label="重命名会话"
            @click="emit('requestRename')"
          >
            <IconEdit class="h-4 w-4" stroke="1.9" />
          </button>
          <button
            v-if="activeSession"
            class="btn-danger inline-flex h-9 w-9 items-center justify-center rounded-full"
            aria-label="删除会话"
            @click="emit('requestDelete')"
          >
            <IconTrash class="h-4 w-4" stroke="1.9" />
          </button>
        </div>
      </div>
    </header>

    <div v-if="!configured" class="grid flex-1 place-items-center text-center">
      <div>
        <h2 class="text-app text-2xl font-semibold">先连接你的 Dux AI 服务</h2>
        <p class="text-app-muted mt-3 text-sm">填写服务器地址和 Token 后，桌面端会自动拉取智能体与会话。</p>
      </div>
    </div>

    <div v-else-if="booting" class="grid flex-1 place-items-center text-center">
      <div>
        <h2 class="text-app text-2xl font-semibold">正在连接服务器</h2>
        <p class="text-app-muted mt-3 text-sm">读取智能体、会话和历史消息中…</p>
      </div>
    </div>

    <template v-else>
      <div class="h-0 flex-1 overflow-hidden">
        <div class="scrollbar-thin h-full overflow-auto pr-2 py-4">
          <div v-if="error" class="error-card mb-4 flex items-center justify-between gap-4 rounded-2xl px-4 py-3 text-sm">
            <span>{{ error }}</span>
            <button class="btn-muted rounded-xl px-3 py-1.5 text-xs" @click="emit('retryBootstrap')">重试</button>
          </div>

          <div v-if="!messages.length" class="grid min-h-full place-items-center pb-12 text-center">
            <div>
              <h3 class="text-xl font-semibold" style="color: var(--app-text);">开始一段新的对话</h3>
            </div>
          </div>

          <div class="space-y-4 pb-2">
            <MessageBubble v-for="message in messages" :key="message.localId || message.id" :message="message" />
          </div>
        </div>
      </div>

      <footer class="shrink-0 border-t pt-4" style="border-color: var(--app-border);">
        <div v-if="pendingAttachments.length" class="mb-3 flex flex-wrap gap-2">
          <div v-for="file in pendingAttachments" :key="file.id" class="surface-card rounded-2xl px-3 py-2 text-xs">
            <div class="text-app font-medium">{{ file.name }}</div>
            <div class="text-app-muted mt-1">{{ file.status === 'uploading' ? '上传中' : file.status === 'uploaded' ? '已就绪' : file.error || '失败' }}</div>
          </div>
        </div>

        <div class="mb-3 flex items-center justify-between gap-3">
          <button class="btn-muted no-drag rounded-2xl px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-55" :disabled="uploading" @click="emit('attach')">
            {{ uploading ? '上传中…' : '添加附件' }}
          </button>
          <div class="text-app-muted text-xs">
            <span v-if="activeAgent">{{ activeAgent.name }}</span>
            <span v-if="sending"> · 正在生成…</span>
          </div>
        </div>

        <div class="panel-plain no-drag flex items-end gap-3 rounded-[20px] px-4 py-4">
          <textarea
            v-model="draft"
            class="textarea-base min-h-[78px] flex-1 resize-none bg-transparent px-1 py-1 text-[15px] leading-7 placeholder:text-[color:var(--app-text-muted)]"
            placeholder="输入消息，Enter 发送，Shift + Enter 换行"
            rows="1"
            :disabled="sending"
            @keydown="onKeydown"
          />
          <div class="flex items-center gap-2">
            <button v-if="sending" class="btn-muted rounded-2xl px-4 py-3 text-sm" @click="emit('cancel')">停止</button>
            <button v-else class="btn-accent rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55" :disabled="!canSend" @click="submit">发送</button>
          </div>
        </div>
      </footer>
    </template>
  </section>
</template>
