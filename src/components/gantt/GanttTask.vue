<template>
  <g :transform="`translate(${x}, ${y})`" @click="$emit('click')">
    <rect
      v-if="jobchangeWidth > 0"
      class="jobchange-bar"
      :width="jobchangeWidth"
      :height="height"
      rx="4"
    />
    <rect
      class="task-bar"
      :x="jobchangeWidth"
      :width="width - jobchangeWidth"
      :height="height"
      rx="4"
      :fill="color"
    />
    <text class="task-text" :x="jobchangeWidth + 10" :y="textY">{{ task.display }}</text>
  </g>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  task:      { type: Object, required: true },
  resources: { type: Array,  required: true },
  baseDate:  { type: Date,   required: true },
  options:   { type: Object, required: true },
  viewModeConfig:  { type: Object, required: true },
})

defineEmits(['click'])

const resourceIndex = computed(() => props.resources.indexOf(props.task.machine))

const taskColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4']
const color = computed(() => taskColors[props.task.id % taskColors.length])

function minutesToWidth(minutes) {
  const { unit, step, tickWidth } = props.viewModeConfig
  if (unit === 'hour') return (minutes / 60 / step) * tickWidth
  if (unit === 'day')  return (minutes / 1440 / step) * tickWidth
  return (minutes / (1440 * 30) / step) * tickWidth
}

const x = computed(() => {
  const start = props.task.startDate
  const { unit, step, tickWidth } = props.viewModeConfig
  if (unit === 'hour') return ((start - props.baseDate) / 3600000 / step) * tickWidth
  if (unit === 'day')  return ((start - props.baseDate) / 86400000 / step) * tickWidth
  const monthsDiff = (start.getFullYear() - props.baseDate.getFullYear()) * 12 +
                     (start.getMonth() - props.baseDate.getMonth())
  return (monthsDiff / step) * tickWidth
})

const width          = computed(() => minutesToWidth(props.task.duration))
const jobchangeWidth = computed(() => minutesToWidth(props.task.jobchange || 0))
const y              = computed(() => resourceIndex.value * props.options.rowHeight + props.options.barPaddingY)
const height         = computed(() => props.options.rowHeight - props.options.barPaddingY * 2)
const textY          = computed(() => props.options.rowHeight / 2 - props.options.barPaddingY + 5)
</script>

<style scoped>
.jobchange-bar {
  fill: #94a3b8;
}

.task-bar {
  cursor: pointer;
  transition: filter 0.2s;
}

.task-bar:hover {
  filter: brightness(1.1);
}

.task-text {
  font-size: 12px;
  fill: #fff;
  pointer-events: none;
  user-select: none;
}
</style>
