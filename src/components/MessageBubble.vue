<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  message: any
}>()

const roleLabelMap: Record<string, string> = {
  user: '你',
  assistant: 'Dux AI',
  system: '系统',
  tool: '工具',
}

const roleLabel = computed(() => roleLabelMap[props.message.role] || props.message.role)
const isUser = computed(() => props.message.role === 'user')
const html = computed(() => {
  const rendered = marked.parse(String(props.message.displayText || props.message.content || ''))
  return typeof rendered === 'string' ? rendered : ''
})
</script>

<template>
  <div class="flex gap-3" :class="isUser ? 'justify-end' : 'justify-start'">
    <div v-if="!isUser" class="surface-card mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold">
      {{ roleLabel.slice(0, 1) }}
    </div>

    <div class="max-w-[82%]">
      <div class="mb-2 flex items-center gap-2" :class="isUser ? 'justify-end' : 'justify-start'">
        <span class="text-app-soft text-sm font-semibold">{{ roleLabel }}</span>
        <span class="text-app-muted text-sm">{{ message.created_at_label || message.created_at || '' }}</span>
      </div>

      <div
        class="rounded-[22px] border px-4 py-3"
        :style="isUser
          ? 'border: 1px solid color-mix(in srgb, var(--app-accent) 26%, var(--app-border)); background: color-mix(in srgb, var(--app-accent) 16%, var(--app-panel)); color: var(--app-text);'
          : 'border: 1px solid color-mix(in srgb, var(--app-text) 6%, transparent); background: color-mix(in srgb, var(--app-panel-2) 92%, transparent); color: var(--app-text-soft);'"
      >
        <div class="markdown-body" v-html="html" />
        <div v-if="message.attachments?.length" class="mt-3 flex flex-wrap gap-2">
          <div v-for="file in message.attachments" :key="file.id || file.path || file.filename" class="surface-card rounded-2xl px-3 py-2 text-sm">
            <div class="text-app font-medium">{{ file.filename || file.name || '附件' }}</div>
            <div class="text-app-muted mt-1">{{ file.mime_type || file.media_kind || file.kind || 'file' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isUser" class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold" style="background: color-mix(in srgb, var(--app-accent) 22%, transparent); color: white;">
      {{ roleLabel.slice(0, 1) }}
    </div>
  </div>
</template>
