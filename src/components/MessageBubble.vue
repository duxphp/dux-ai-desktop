<script setup lang="ts">
import { IconCheck, IconCopy, IconRefresh } from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import { marked } from 'marked'
import { downloadRemoteAsset } from '../lib/download'
import { openExternalUrl } from '../lib/external'
import { copySelectedTextWithin, getSelectedTextWithin, showNativeContextMenu } from '../lib/native-menu'
import { pushToast } from '../lib/toast'

const props = defineProps<{
  message: any
  approvalSubmittingKey?: string
}>()

const emit = defineEmits<{
  retry: []
  cardAction: [button: any]
}>()

const hovering = ref(false)
const copied = ref(false)
const bubbleRef = ref<HTMLElement | null>(null)

const roleLabelMap: Record<string, string> = {
  user: '用户',
  assistant: '助手',
  system: '系统',
  tool: '工具',
}

const roleLabel = computed(() => roleLabelMap[props.message.role] || props.message.role)
const isUser = computed(() => props.message.role === 'user')
const attachments = computed(() => Array.isArray(props.message.attachments) ? props.message.attachments : [])
const mediaAttachments = computed(() => attachments.value.filter((item: any) => item?.kind === 'image' || item?.kind === 'video'))
const fileAttachments = computed(() => attachments.value.filter((item: any) => item?.kind === 'file'))
const approvalStatus = computed(() => String(props.message.meta?.approval?.status || ''))
const approvalData = computed(() => {
  if (props.message.role !== 'assistant') {
    return null
  }
  return (props.message.meta?.approval && typeof props.message.meta.approval === 'object') ? props.message.meta.approval : null
})
const approvalRequest = computed(() => approvalData.value?.request && typeof approvalData.value.request === 'object' ? approvalData.value.request : {})
const approvalAction = computed(() => String(approvalData.value?.action_name || approvalData.value?.tool_name || ''))
const approvalRisk = computed(() => String(approvalData.value?.risk_level || ''))
const approvalSummary = computed(() => String(approvalData.value?.summary || ''))
const approvalHint = computed(() => String(approvalData.value?.hint || ''))
const approvalCommand = computed(() => {
  const request = approvalRequest.value as any
  const payload = request?.actions?.[0]?.parsed?.payload || request?.payload || {}
  if (payload && typeof payload === 'object') {
    if (payload.command) {
      return String(payload.command)
    }
    if (payload.payload && typeof payload.payload === 'object' && payload.payload.command) {
      return String(payload.payload.command)
    }
  }
  return ''
})
const rawText = computed(() => {
  if (typeof props.message.displayText === 'string') {
    return props.message.displayText
  }
  if (typeof props.message.content === 'string') {
    return props.message.content
  }
  return ''
})
const normalizedText = computed(() => {
  let value = rawText.value
  if (!value.trim()) {
    return ''
  }

  if (mediaAttachments.value.length) {
    value = value
      .replace(/!\[[^\]]*\]\(([^)]+)\)/g, '')
      .replace(/<img\b[^>]*>/gi, '')
      .replace(/<video\b[\s\S]*?<\/video>/gi, '')
      .replace(/<source\b[^>]*>/gi, '')
      .replace(/(^|\n)\s*https?:\/\/\S+\.(png|jpe?g|gif|webp|svg|mp4|mov|m4v|webm)(\?\S*)?\s*(?=\n|$)/gi, '$1')
      .replace(/(?:\r?\n){3,}/g, '\n\n')
      .trim()
  }

  if (value === '已发送附件' && mediaAttachments.value.length) {
    return ''
  }

  return value
})
const hasText = computed(() => normalizedText.value.trim().length > 0)
const isLoading = computed(() => props.message.role === 'assistant' && props.message.meta?.status === 'loading' && !hasText.value && mediaAttachments.value.length === 0 && fileAttachments.value.length === 0)
const isError = computed(() => props.message.role === 'assistant' && props.message.meta?.status === 'error')
const html = computed(() => {
  const rendered = marked.parse(normalizedText.value)
  return typeof rendered === 'string' ? rendered : ''
})

function buttonKey(button: any) {
  return `${String(button?.approval_id || '')}:${String(button?.text || button?.decision || button?.label || '')}`
}

function isApprovalButton(button: any) {
  return String(button?.type || '').toLowerCase() === 'approval-reply'
}

function isButtonDisabled(button: any) {
  if (isApprovalButton(button)) {
    return ((!!props.approvalSubmittingKey && approvalIdValue(button) !== '' && props.approvalSubmittingKey.startsWith(`${approvalIdValue(button)}:`))
      || (!!approvalStatus.value && approvalStatus.value !== 'pending'))
  }
  return false
}

function isButtonSubmitting(button: any) {
  return isApprovalButton(button)
    && !!props.approvalSubmittingKey
    && props.approvalSubmittingKey === buttonKey(button)
}

function approvalIdValue(button: any) {
  return String(button?.approval_id || props.message?.meta?.approval?.id || '')
}

function buttonClass(button: any) {
  if (isApprovalButton(button)) {
    const text = String(button?.text || '').trim()
    if (!!approvalStatus.value && approvalStatus.value !== 'pending') {
      return 'opacity-45 cursor-not-allowed'
    }
    if (text === '同意') {
      return 'btn-primary'
    }
    if (text === '拒绝') {
      return 'btn-danger'
    }
  }
  return ''
}

function approvalStatusLabel(status: string) {
  switch (status) {
    case 'approved':
      return '已同意'
    case 'rejected':
      return '已拒绝'
    case 'expired':
      return '已过期'
    case 'pending':
      return '待审批'
    default:
      return status
  }
}

function approvalStatusClass(status: string) {
  switch (status) {
    case 'approved':
      return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'
    case 'rejected':
      return 'border-rose-500/25 bg-rose-500/10 text-rose-500'
    case 'expired':
      return 'border-slate-500/25 bg-slate-500/10 text-slate-400'
    case 'pending':
      return 'border-amber-500/25 bg-amber-500/10 text-amber-500'
    default:
      return 'border-app bg-[color:color-mix(in_srgb,var(--app-panel-2)_94%,transparent)] text-app-muted'
  }
}

async function handleCardButtonClick(button: any) {
  if (isButtonDisabled(button)) {
    return
  }
  emit('cardAction', button)
}

async function setCopiedState(message = '已复制到剪贴板') {
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 800)
  pushToast(message, 'success')
}

async function copyMessage() {
  const text = String(props.message.displayText || props.message.content || '').trim()
  if (!text) {
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    await setCopiedState()
  }
  catch {
    pushToast('复制失败', 'error')
  }
}

async function handleContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const link = target?.closest('a') as HTMLAnchorElement | null
  if (!link?.href) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  await openExternalUrl(link.href)
}


async function downloadAttachment(url: string, filename?: string, mimeType?: string, label = '文件') {
  try {
    const saved = await downloadRemoteAsset({
      url,
      filename,
      mimeType,
    })
    if (saved) {
      pushToast(`${label}已开始下载`, 'success')
    }
  }
  catch {
    pushToast('下载失败', 'error')
  }
}

async function copyAttachmentUrl(url: string, message = '已复制链接') {
  try {
    await navigator.clipboard.writeText(url)
    pushToast(message, 'success')
  }
  catch {
    pushToast('复制失败', 'error')
  }
}

async function handleContextMenu(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const image = target?.closest('img') as HTMLImageElement | null
  const video = target?.closest('video') as HTMLVideoElement | null
  const attachment = target?.closest('[data-attachment-url]') as HTMLElement | null
  const media = target?.closest('[data-media-url]') as HTMLElement | null
  const link = target?.closest('a') as HTMLAnchorElement | null

  const mediaUrl = String(media?.dataset.mediaUrl || '')
  if (image?.src || video?.currentSrc || mediaUrl) {
    const url = image?.src || video?.currentSrc || mediaUrl
    const mediaKind = image ? 'image' : (video ? 'video' : String(media?.dataset.mediaKind || 'file'))
    event.preventDefault()
    event.stopPropagation()
    await showNativeContextMenu(event, [
      { text: mediaKind === 'image' ? '复制图片链接' : '复制视频链接', action: () => copyAttachmentUrl(url, mediaKind === 'image' ? '已复制图片链接' : '已复制视频链接') },
      { text: mediaKind === 'image' ? '下载图片' : '下载视频', action: () => downloadAttachment(url, media?.dataset.mediaFilename || undefined, media?.dataset.mediaMimeType || undefined, mediaKind === 'image' ? '图片' : '视频') },
    ])
    return
  }

  const attachmentUrl = String(attachment?.dataset.attachmentUrl || '')
  if (attachmentUrl) {
    const attachmentKind = String(attachment?.dataset.attachmentKind || '')
    event.preventDefault()
    event.stopPropagation()
    await showNativeContextMenu(event, [
      { text: attachmentKind === 'image' ? '复制图片链接' : '复制附件链接', action: () => copyAttachmentUrl(attachmentUrl) },
    ])
    return
  }

  if (link?.href) {
    event.preventDefault()
    event.stopPropagation()
    await showNativeContextMenu(event, [
      { text: '复制链接', action: () => copyAttachmentUrl(link.href) },
    ])
    return
  }

  const selectedText = getSelectedTextWithin(bubbleRef.value)
  if (selectedText) {
    event.preventDefault()
    event.stopPropagation()
    await showNativeContextMenu(event, [
      {
        text: '复制',
        action: async () => {
          try {
            const copiedSelection = await copySelectedTextWithin(bubbleRef.value)
            if (copiedSelection) {
              pushToast('已复制选中文本', 'success')
            }
          }
          catch {
            pushToast('复制失败', 'error')
          }
        },
      },
    ])
    return
  }

  const text = String(props.message.displayText || props.message.content || '').trim()
  if (!text && !isError.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  await showNativeContextMenu(event, [
    isError.value
      ? {
          text: '重试',
          action: () => emit('retry'),
        }
      : {
          text: '复制消息',
          action: () => copyMessage(),
        },
  ])
}
</script>

<template>
  <div class="flex gap-3" :class="isUser ? 'justify-end' : 'justify-start'">
    <div v-if="!isUser" class="surface-card mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold">
      {{ roleLabel.slice(0, 1) }}
    </div>

    <div
      ref="bubbleRef"
      class="max-w-[82%]"
      data-context-menu-controlled="true"
      @mouseenter="hovering = true"
      @mouseleave="hovering = false"
      @contextmenu="handleContextMenu"
    >
      <div class="mb-2 flex items-center gap-2" :class="isUser ? 'justify-end' : 'justify-start'">
        <span class="text-app-soft text-sm font-semibold">{{ roleLabel }}</span>
        <span class="text-app-muted text-sm">{{ message.created_at_label || message.created_at || '' }}</span>
      </div>

      <div
        class="rounded-[22px] border px-4 py-3"
        :style="isError
          ? 'border: 1px solid color-mix(in srgb, var(--app-danger) 30%, var(--app-border)); background: color-mix(in srgb, var(--app-danger) 10%, var(--app-panel)); color: var(--app-text);'
          : isUser
            ? 'border: 1px solid color-mix(in srgb, var(--app-accent) 26%, var(--app-border)); background: color-mix(in srgb, var(--app-accent) 16%, var(--app-panel)); color: var(--app-text);'
            : 'border: 1px solid color-mix(in srgb, var(--app-text) 6%, transparent); background: color-mix(in srgb, var(--app-panel-2) 92%, transparent); color: var(--app-text);'"
      >
        <div v-if="isLoading" class="thinking-text py-1">
          <span class="thinking-wave text-sm">正在思考...</span>
        </div>
        <div v-else-if="hasText" class="markdown-body selectable-text text-[color:var(--app-text)]" v-html="html" @click="handleContentClick" />

        <div v-if="mediaAttachments.length" class="mt-3 space-y-3">
          <div
            v-for="file in mediaAttachments"
            :key="file.id || file.path || file.filename || file.url"
            class="overflow-hidden rounded-[18px] border border-[color:color-mix(in_srgb,var(--app-text)_8%,transparent)] bg-[color:color-mix(in_srgb,var(--app-panel-2)_94%,transparent)]"
            :data-media-url="String(file.url || '')"
            :data-media-kind="String(file.kind || '')"
            :data-media-filename="String(file.filename || '')"
            :data-media-mime-type="String(file.mime_type || '')"
          >
            <img
              v-if="file.kind === 'image'"
              :src="file.url"
              :alt="file.filename || '图片'"
              class="message-media-image block max-h-[420px] w-full cursor-pointer object-cover"
              loading="lazy"
            >
            <video
              v-else-if="file.kind === 'video'"
              :src="file.url"
              class="message-media-video block max-h-[420px] w-full bg-black"
              controls
              playsinline
              preload="metadata"
            />
          </div>
        </div>

        <div v-if="approvalData" class="mt-3 space-y-3">
          <div class="text-app text-sm font-semibold">执行审批</div>
          <div v-if="approvalSummary" class="text-app-muted text-xs leading-5">{{ approvalSummary }}</div>
          <div class="mt-3 space-y-1.5 text-sm">
            <div class="flex items-start justify-between gap-3">
              <div class="text-app-soft">动作</div>
              <div class="text-app text-right">{{ approvalAction || '-' }}</div>
            </div>
            <div class="flex items-start justify-between gap-3">
              <div class="text-app-soft">风险</div>
              <div class="text-app text-right">{{ approvalRisk || '-' }}</div>
            </div>
            <div v-if="approvalCommand" class="flex items-start justify-between gap-3">
              <div class="text-app-soft">命令</div>
              <div class="text-app text-right break-all">{{ approvalCommand }}</div>
            </div>
            <div class="flex items-start justify-between gap-3">
              <div class="text-app-soft">审批状态</div>
              <div class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold" :class="approvalStatusClass(approvalStatus || 'pending')">
                {{ approvalStatusLabel(approvalStatus || 'pending') }}
              </div>
            </div>
          </div>
          <div v-if="approvalHint && (approvalStatus === 'pending' || !approvalStatus)" class="mt-3 text-xs text-app-muted leading-5">
            {{ approvalHint }}
          </div>
          <div v-if="approvalStatus === 'pending' || !approvalStatus" class="mt-3 flex flex-wrap justify-end gap-2">
            <button
              class="btn-muted rounded-full px-3 py-1.5 text-xs font-medium btn-primary"
              :disabled="isButtonDisabled({ type: 'approval-reply', approval_id: approvalData?.id, text: '同意' })"
              @click="handleCardButtonClick({ type: 'approval-reply', approval_id: approvalData?.id, text: '同意' })"
            >
              {{ isButtonSubmitting({ type: 'approval-reply', approval_id: approvalData?.id, text: '同意' }) ? '处理中…' : '同意' }}
            </button>
            <button
              class="btn-muted rounded-full px-3 py-1.5 text-xs font-medium btn-danger"
              :disabled="isButtonDisabled({ type: 'approval-reply', approval_id: approvalData?.id, text: '拒绝' })"
              @click="handleCardButtonClick({ type: 'approval-reply', approval_id: approvalData?.id, text: '拒绝' })"
            >
              {{ isButtonSubmitting({ type: 'approval-reply', approval_id: approvalData?.id, text: '拒绝' }) ? '处理中…' : '拒绝' }}
            </button>
          </div>
        </div>

        <div v-if="fileAttachments.length" class="mt-3 flex flex-wrap gap-2">
          <div
            v-for="file in fileAttachments"
            :key="file.id || file.path || file.filename || file.url"
            class="surface-card rounded-2xl px-3 py-2 text-sm"
            :data-attachment-url="String(file.url || '')"
            :data-attachment-kind="String(file.kind || '')"
          >
            <div class="text-app font-medium">{{ file.filename || file.name || '附件' }}</div>
            <div class="text-app-muted mt-1">{{ file.mime_type || file.media_kind || file.kind || 'file' }}</div>
          </div>
        </div>
      </div>

      <div class="message-copy-row" :class="isUser ? 'justify-end' : 'justify-start'">
          <button
            v-if="isError"
            class="btn-danger message-copy-btn"
            aria-label="重试消息"
          @click="emit('retry')"
        >
          <IconRefresh class="h-4 w-4" stroke="1.9" />
        </button>
        <button
          v-else-if="hovering || copied"
          class="btn-ghost message-copy-btn"
          :aria-label="copied ? '已复制' : '复制消息'"
          @click="copyMessage"
        >
          <IconCheck v-if="copied" class="h-4 w-4" stroke="1.9" />
          <IconCopy v-else class="h-4 w-4" stroke="1.9" />
        </button>
      </div>
    </div>

    <div v-if="isUser" class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white" style="background: color-mix(in srgb, var(--app-accent) 22%, transparent);">
      {{ roleLabel.slice(0, 1) }}
    </div>
  </div>
</template>
