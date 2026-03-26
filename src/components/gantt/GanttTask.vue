<template>
  <g
    :transform="`translate(${x}, ${y})`"
    :class="{ dragging: isDragging }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @click="onClick"
  >
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
import { computed, ref } from 'vue'

const props = defineProps({
  task:      { type: Object, required: true },
  resources: { type: Array,  required: true },
  baseDate:  { type: Date,   required: true },
  options:   { type: Object, required: true },
  viewModeConfig:  { type: Object, required: true },
})

const emit = defineEmits(['click', 'move'])

const resourceIndex = computed(() => props.resources.indexOf(props.task.machine))

const taskColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4']
const color = computed(() => taskColors[props.task.id % taskColors.length])

function minutesToWidth(minutes) {
  const { unit, step, tickWidth } = props.viewModeConfig
  if (unit === 'hour') return (minutes / 60 / step) * tickWidth
  if (unit === 'day')  return (minutes / 1440 / step) * tickWidth
  return (minutes / (1440 * 30) / step) * tickWidth
}

// 拖拽中的临时状态：实时预览位移，松手后再写回任务时间
const isDragging = ref(false)
const dragDeltaMinutes = ref(0)
let dragStartClientX = 0
let hasDragged = false

function minutesPerPixel() {
  const { unit, step, tickWidth } = props.viewModeConfig
  if (unit === 'hour') return (step * 60) / tickWidth
  if (unit === 'day')  return (step * 1440) / tickWidth
  return (step * 1440 * 30) / tickWidth
}

function onPointerDown(event) {
  if (event.button !== 0) return
  isDragging.value = true
  hasDragged = false
  dragDeltaMinutes.value = 0
  dragStartClientX = event.clientX
  event.currentTarget.setPointerCapture(event.pointerId)
}

function onPointerMove(event) {
  if (!isDragging.value) return
  const deltaX = event.clientX - dragStartClientX
  const rawMinutes = deltaX * minutesPerPixel()
  // 最小粒度为30分钟，拖拽过程和最终落点都按该粒度吸附
  const snapped = Math.round(rawMinutes / 30) * 30
  if (snapped !== 0) hasDragged = true
  dragDeltaMinutes.value = snapped
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  if (hasDragged && dragDeltaMinutes.value !== 0) {
    const newStartDate = new Date(props.task.startDate.getTime() + dragDeltaMinutes.value * 60000)
    emit('move', { id: props.task.id, startDate: newStartDate })
  }
  dragDeltaMinutes.value = 0
}

function onClick() {
  // 防止拖拽结束后触发误点击，只有纯点击才打开编辑
  if (hasDragged) return
  emit('click')
}

const baseX = computed(() => {
  const start = props.task.startDate
  const { unit, step, tickWidth } = props.viewModeConfig
  if (unit === 'hour') return ((start - props.baseDate) / 3600000 / step) * tickWidth
  if (unit === 'day')  return ((start - props.baseDate) / 86400000 / step) * tickWidth
  const monthsDiff = (start.getFullYear() - props.baseDate.getFullYear()) * 12 +
                     (start.getMonth() - props.baseDate.getMonth())
  return (monthsDiff / step) * tickWidth
})

// 任务条横坐标 = 原始位置 + 拖拽中的临时偏移
const x = computed(() => baseX.value + minutesToWidth(dragDeltaMinutes.value))

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
  cursor: grab;
  transition: filter 0.2s;
}

.task-bar:hover {
  filter: brightness(1.1);
}

.dragging .task-bar {
  cursor: grabbing;
  opacity: 0.85;
}

.task-text {
  font-size: 12px;
  fill: #fff;
  pointer-events: none;
  user-select: none;
}
</style>
