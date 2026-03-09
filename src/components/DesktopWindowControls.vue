<script setup lang="ts">
import { IconMinus, IconSquare, IconX } from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import { closeWindow, isMacLike, minimizeWindow, toggleMaximizeWindow } from '../lib/window'

const props = withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})

const hovering = ref(false)
const isWindowsLike = computed(() => !isMacLike)

async function handleMinimize() {
  await minimizeWindow()
}

async function handleToggleMaximize() {
  await toggleMaximizeWindow()
}

async function handleClose() {
  await closeWindow()
}
</script>

<template>
  <div
    class="no-drag relative z-20 flex items-center pointer-events-auto select-none"
    :class="isMacLike ? 'gap-2' : 'gap-0 self-stretch'"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <template v-if="isMacLike">
      <button type="button" class="window-traffic bg-[#ff5f57]" aria-label="关闭窗口" @mousedown.stop.prevent @click="handleClose">
        <span v-show="hovering">×</span>
      </button>
      <button type="button" class="window-traffic bg-[#febc2e]" aria-label="最小化窗口" @mousedown.stop.prevent @click="handleMinimize">
        <span v-show="hovering">—</span>
      </button>
      <button type="button" class="window-traffic bg-[#28c840]" aria-label="最大化窗口" @mousedown.stop.prevent @click="handleToggleMaximize">
        <span v-show="hovering">+</span>
      </button>
    </template>
    <template v-else>
      <button type="button" class="window-win-button" :class="compact ? 'h-full w-[46px]' : ''" aria-label="最小化窗口" @mousedown.stop.prevent @click.stop.prevent="handleMinimize">
        <IconMinus class="h-3.5 w-3.5" stroke="2" />
      </button>
      <button type="button" class="window-win-button" :class="compact ? 'h-full w-[46px]' : ''" aria-label="最大化窗口" @mousedown.stop.prevent @click.stop.prevent="handleToggleMaximize">
        <IconSquare class="h-3.5 w-3.5" stroke="1.8" />
      </button>
      <button type="button" class="window-win-button window-win-close" :class="compact ? 'h-full w-[46px]' : ''" aria-label="关闭窗口" @mousedown.stop.prevent @click.stop.prevent="handleClose">
        <IconX class="h-3.5 w-3.5" stroke="2" />
      </button>
    </template>
  </div>
</template>
