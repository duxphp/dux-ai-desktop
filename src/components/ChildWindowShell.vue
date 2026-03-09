<script setup lang="ts">
import { computed } from 'vue'
import { isMacLike } from '../lib/window'

defineProps<{
  title: string
  description?: string
}>()

const panelClass = computed(() => isMacLike
  ? 'glass-shell rounded-none border-0 shadow-none'
  : 'windows-native-shell m-0 rounded-none border-0 shadow-none')
</script>

<template>
  <div class="h-full w-full overflow-hidden bg-transparent text-app-text">
    <div class="flex h-full flex-col overflow-hidden" :class="panelClass">
      <div class="shrink-0 border-b border-app p-6" data-tauri-drag-region>
        <h1 class="text-app text-xl font-semibold">{{ title }}</h1>
        <p v-if="description" class="text-app-muted mt-1 text-sm">{{ description }}</p>
      </div>
      <div class="no-drag min-h-0 flex-1 overflow-auto" :class="isMacLike ? 'p-4' : 'p-6'">
        <slot />
      </div>
    </div>
  </div>
</template>
