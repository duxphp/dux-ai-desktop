<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, ref } from 'vue'

const props = defineProps<{
  sessions: any[]
  agents: any[]
  activeSessionId: number | null
  activeAgentCode: string
  loading: boolean
  configured: boolean
}>()

const emit = defineEmits<{
  createSession: []
  selectSession: [id: number]
  selectAgent: [code: string]
}>()

const sortedSessions = computed(() => {
  return [...props.sessions].sort((a, b) => String(b.last_message_at || b.updated_at || '').localeCompare(String(a.last_message_at || a.updated_at || '')))
})

const activeAgent = computed(() => props.agents.find(item => item.id === props.activeAgentCode) || null)
const showAgentPicker = ref(false)

function formatTime(value?: string | null) {
  if (!value)
    return ''
  const date = dayjs(value)
  if (!date.isValid())
    return value
  return date.format('MM/DD HH:mm')
}

function chooseAgent(code: string) {
  emit('selectAgent', code)
  showAgentPicker.value = false
}

function agentInitial(agent: any) {
  const value = String(agent?.name || agent?.id || '?').trim()
  return value.slice(0, 1).toUpperCase()
}
</script>

<template>
  <aside class="flex h-full min-h-0 flex-col overflow-hidden px-4 py-4">
    <div class="mb-4 shrink-0 px-1">
      <div class="text-base font-semibold text-app">Dux AI</div>
      <div class="mt-0.5 text-sm text-app-muted">Desktop Client</div>
    </div>

    <div class="mb-4 shrink-0 space-y-3">
      <label class="block text-xs font-medium text-app-muted">智能体</label>
      <button class="btn-muted no-drag flex w-full items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-left" @click="showAgentPicker = true">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--app-accent)_14%,transparent)] text-sm font-semibold text-[color:var(--app-accent)]">
            {{ agentInitial(activeAgent) }}
          </div>
          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-app">{{ activeAgent?.name || '选择智能体' }}</div>
            <div class="mt-1 truncate text-xs text-app-muted">{{ activeAgent?.description || activeAgent?.id || '点击切换智能体' }}</div>
          </div>
        </div>
        <div class="text-app-muted">›</div>
      </button>

      <button
        class="btn-accent no-drag w-full rounded-[14px] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
        :disabled="!configured || loading"
        @click="emit('createSession')"
      >
        新建会话
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-hidden">
      <div class="mb-3 shrink-0 px-1 text-xs font-medium text-app-muted">会话</div>
      <div class="scrollbar-thin h-[calc(100%-1.75rem)] overflow-auto pr-1">
        <div class="space-y-2 pb-2">
          <div v-if="!configured" class="empty-card grid min-h-32 place-items-center rounded-[14px] px-5 text-center text-sm">
            请先在右上角打开设置并配置连接。
          </div>
          <div v-else-if="loading" class="empty-card grid min-h-32 place-items-center rounded-[14px] px-5 text-center text-sm">
            正在加载会话…
          </div>

          <button
            v-for="session in sortedSessions"
            :key="session.id"
            class="session-card no-drag flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left"
            :class="activeSessionId === session.id ? 'session-card-active' : ''"
            @click="emit('selectSession', session.id)"
          >
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium text-app">{{ session.title || '未命名会话' }}</div>
            </div>
            <div class="shrink-0 text-xs text-app-muted">{{ formatTime(session.last_message_at || session.updated_at) }}</div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAgentPicker" class="no-drag absolute inset-0 z-40 grid place-items-center bg-black/28 backdrop-blur-sm">
      <div class="dialog-panel w-full max-w-md rounded-[14px] px-5 py-5">
        <div class="text-app text-lg font-semibold">切换智能体</div>
        <p class="text-app-muted mt-2 text-sm">选择要使用的智能体。</p>

        <div class="mt-5 space-y-2">
          <button
            v-for="agent in agents"
            :key="agent.id"
            class="session-card flex w-full items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-left"
            :class="activeAgentCode === agent.id ? 'session-card-active' : ''"
            @click="chooseAgent(agent.id)"
          >
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--app-accent)_14%,transparent)] text-sm font-semibold text-[color:var(--app-accent)]">
                {{ agentInitial(agent) }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-app">{{ agent.name || agent.id }}</div>
                <div class="text-app-muted mt-1 truncate text-xs">{{ agent.description || agent.id }}</div>
              </div>
            </div>
            <div v-if="activeAgentCode === agent.id" class="rounded-full px-2 py-1 text-[11px] font-medium text-[color:var(--app-accent)] bg-[color:color-mix(in_srgb,var(--app-accent)_12%,transparent)]">当前</div>
          </button>
        </div>

        <div class="mt-5 flex justify-end gap-3">
          <button class="dialog-btn-muted" @click="showAgentPicker = false">取消</button>
        </div>
      </div>
    </div>
  </aside>
</template>
