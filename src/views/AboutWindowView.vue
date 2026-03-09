<script setup lang="ts">
import { IconBrandGithub, IconExternalLink, IconInfoCircle, IconWorld } from '@tabler/icons-vue'
import ChildWindowShell from '../components/ChildWindowShell.vue'
import { openExternalUrl } from '../lib/external'
</script>

<template>
  <ChildWindowShell title="关于 Dux AI" description="独立桌面聊天客户端。">
    <div class="space-y-4 text-sm text-[color:var(--app-text-soft)]">
      <div class="surface-card rounded-2xl px-4 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--app-accent)_14%,transparent)] text-[color:var(--app-accent)]">
            <IconInfoCircle class="h-5 w-5" stroke="1.9" />
          </div>
          <div>
            <div class="text-app font-medium">关于</div>
            <div class="text-app-muted mt-1 text-xs">产品介绍</div>
          </div>
        </div>
        <div class="text-app-muted mt-4 leading-6">
          Dux AI Desktop 是面向 Dux AI 服务端的独立桌面聊天客户端，强调原生窗口体验与高效对话交互。
        </div>
      </div>

      <button
        class="btn-muted no-drag flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left"
        @click="openExternalUrl('https://www.dux.cn')"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--app-accent)_14%,transparent)] text-[color:var(--app-accent)]">
            <IconWorld class="h-5 w-5" stroke="1.9" />
          </div>
          <div>
            <div class="text-app font-medium">官网</div>
            <div class="text-app-muted mt-1 text-xs">www.dux.cn</div>
          </div>
        </div>
        <IconExternalLink class="h-4.5 w-4.5 text-[color:var(--app-text-muted)]" stroke="1.9" />
      </button>

      <button
        class="btn-muted no-drag flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left"
        @click="openExternalUrl('https://github.com/duxweb/dux-ai')"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--app-accent)_14%,transparent)] text-[color:var(--app-accent)]">
            <IconBrandGithub class="h-5 w-5" stroke="1.9" />
          </div>
          <div>
            <div class="text-app font-medium">仓库</div>
            <div class="text-app-muted mt-1 text-xs">github.com/duxweb/dux-ai</div>
          </div>
        </div>
        <IconExternalLink class="h-4.5 w-4.5 text-[color:var(--app-text-muted)]" stroke="1.9" />
      </button>
    </div>
  </ChildWindowShell>
</template>
