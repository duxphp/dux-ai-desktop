<script setup lang="ts">
import { IconAlertCircle, IconCheck, IconInfoCircle } from '@tabler/icons-vue'
import { useToasts } from '../lib/toast'

const { toasts } = useToasts()
</script>

<template>
  <div class="pointer-events-none fixed left-1/2 top-4 z-[100] -translate-x-1/2 px-4">
    <TransitionGroup name="toast-stack" tag="div" class="flex flex-col items-center gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card pointer-events-auto inline-flex max-w-[80vw] items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white backdrop-blur-xl"
        :style="toast.type === 'success'
          ? 'background: color-mix(in srgb, var(--app-accent-strong) 88%, transparent);'
          : toast.type === 'error'
            ? 'background: color-mix(in srgb, var(--app-danger) 88%, transparent);'
            : 'background: rgba(39, 39, 42, 0.88);'"
      >
        <div class="shrink-0 text-white/90">
          <IconCheck v-if="toast.type === 'success'" class="h-4.5 w-4.5" stroke="2" />
          <IconAlertCircle v-else-if="toast.type === 'error'" class="h-4.5 w-4.5" stroke="2" />
          <IconInfoCircle v-else class="h-4.5 w-4.5" stroke="2" />
        </div>
        <span class="min-w-0 whitespace-nowrap">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>
