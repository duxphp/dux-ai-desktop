<script setup lang="ts">
import { reactive, watch } from 'vue'

const props = defineProps<{
  open: boolean
  loading: boolean
  testing: boolean
  form: { serverUrl: string, token: string }
  lastTestMessage: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:form': [value: { serverUrl: string, token: string }]
  test: []
  save: []
}>()

const draft = reactive({
  serverUrl: '',
  token: '',
})

watch(() => props.open, (value) => {
  if (value) {
    draft.serverUrl = props.form.serverUrl || ''
    draft.token = props.form.token || ''
  }
}, { immediate: true })

watch(draft, () => {
  emit('update:form', { ...draft })
}, { deep: true })
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 grid place-items-center bg-black/36 p-6 backdrop-blur-md" @click.self="emit('update:open', false)">
    <div class="w-full max-w-xl rounded-[28px] border border-white/10 bg-[rgba(15,18,24,0.88)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-xl font-semibold text-white/94">连接设置</h3>
          <p class="mt-2 text-sm text-white/46">保存你的 Dux AI 服务地址和 API Token。</p>
        </div>
        <button class="btn-muted rounded-2xl px-3 py-2 text-sm" @click="emit('update:open', false)">关闭</button>
      </div>

      <div class="mt-6 grid gap-4">
        <label class="text-sm font-medium text-white/42">服务器地址</label>
        <input v-model="draft.serverUrl" class="field-base rounded-2xl px-4 py-3 text-sm" placeholder="例如 http://127.0.0.1:8000" />

        <label class="text-sm font-medium text-white/42">Token</label>
        <input v-model="draft.token" type="password" class="field-base rounded-2xl px-4 py-3 text-sm" placeholder="sk-..." />

        <div v-if="lastTestMessage" class="field-surface rounded-2xl px-4 py-3 text-sm">
          {{ lastTestMessage }}
        </div>
      </div>

      <div class="mt-6 flex items-center justify-end gap-3">
        <button class="btn-muted rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-55" :disabled="testing" @click="emit('test')">
          {{ testing ? '连接中…' : '测试连接' }}
        </button>
        <button class="btn-accent rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55" :disabled="loading" @click="emit('save')">
          {{ loading ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>
