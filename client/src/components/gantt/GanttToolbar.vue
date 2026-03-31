<template>
  <div v-if="options.view_mode_select || options.today_button" class="toolbar">
    <n-button-group v-if="options.view_mode_select" class="mode-group">
      <n-button
        v-for="(mode, key) in options.view_modes"
        :key="key"
        size="small"
        :type="viewMode === key ? 'primary' : 'default'"
        style="flex: 1"
        @click="emit('change-mode', key)"
      >
        {{ mode.name }}
      </n-button>
    </n-button-group>
    <n-button
      v-if="options.today_button"
      size="small"
      type="primary"
      ghost
      style="margin-left: auto"
      @click="emit('scroll-to-today')"
    >
      今天
    </n-button>
  </div>
</template>

<script setup>
import { NButton, NButtonGroup } from 'naive-ui'

defineProps({
  options: { type: Object, required: true },
  viewMode: { type: String, required: true }
})

const emit = defineEmits(['change-mode', 'scroll-to-today'])
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.mode-group {
  display: flex;
}
</style>
