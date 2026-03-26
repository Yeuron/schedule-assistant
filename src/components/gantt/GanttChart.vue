<template>
  <div class="gantt-container">
    <!-- 视图模式选择器 -->
    <div v-if="options.view_mode_select" class="view-mode-selector">
      <button
        v-for="(mode, key) in options.view_modes"
        :key="key"
        class="mode-button"
        :class="{ active: viewMode === key }"
        @click="changeViewMode(key)"
      >
        {{ mode.name }}
      </button>
    </div>

    <div class="gantt-wrapper" ref="ganttWrapper" :style="{ '--tick-width': `${viewModeConfig.tickWidth}px`, '--row-height': `${options.rowHeight}px` }">
      <div class="gantt-corner">资源 \ 时间</div>

      <div class="gantt-timeline">
      <!-- 上层时间轴 -->
      <div class="timeline-upper">
        <div
          v-for="group in upperGroups"
          :key="group.key"
          class="time-group"
          :style="{ width: `${group.span * viewModeConfig.tickWidth}px` }"
        >
          {{ group.label }}
        </div>
      </div>
      <!-- 下层时间轴 -->
      <div class="timeline-lower">
        <div v-for="tick in timeTicks" :key="tick.date" class="time-tick">
          {{ tick.lowerLabel }}
        </div>
      </div>
    </div>

    <div class="gantt-resources">
      <div v-for="resource in resources" :key="resource" class="resource-item">
        {{ resource }}
      </div>
    </div>

    <div class="gantt-data">
      <svg :width="svgWidth" :height="svgHeight" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid"
            :width="viewModeConfig.tickWidth"
            :height="options.rowHeight"
            patternUnits="userSpaceOnUse"
          >
            <path
              :d="`M ${viewModeConfig.tickWidth} 0 L ${viewModeConfig.tickWidth} ${options.rowHeight} L 0 ${options.rowHeight}`"
              fill="none"
              stroke="#f1f5f9"
              stroke-width="1"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- 任务条 -->
        <!-- 子组件只上报位移结果，实际数据更新在 App.vue 统一处理 -->
        <GanttTask
          v-for="task in computedTasks"
          :key="task.id"
          :task="task"
          :resources="resources"
          :baseDate="baseDate"
          :viewModeConfig="viewModeConfig"
          :options="options"
          @click="emit('task-click', task)"
          @move="emit('task-move', $event)"
        />

        <!-- 当前时间线 -->
        <line
          v-if="options.show_current_time && currentTimeLine !== null"
          :x1="currentTimeLine"
          :y1="0"
          :x2="currentTimeLine"
          :y2="svgHeight"
          class="current-time-line"
        />
      </svg>
    </div>
  </div>
  </div>

</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { DEFAULT_OPTIONS } from './defaults'
import GanttTask from './GanttTask.vue'

const props = defineProps({
  resources: {
    type: Array,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

const ganttWrapper = ref(null)

// 合并默认配置和传入的配置
const options = computed(() => ({
  ...DEFAULT_OPTIONS,
  ...props.options
}))

// 内部视图模式状态（用于手动切换）
const viewMode = ref(options.value.view_mode)

// 获取当前视图模式配置
const viewModeConfig = computed(() => options.value.view_modes[viewMode.value])

// 切换视图模式
const changeViewMode = (mode) => {
  viewMode.value = mode
}

// 生成时间刻度
const timeTicks = computed(() => {
  const ticks = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const mode = viewModeConfig.value

  if (mode.unit === 'hour') {
    // 小时模式
    const startHour = mode.dayStartHour ?? 0

    for (let d = options.value.startDay; d <= options.value.endDay; d++) {
      // 每天从 startHour 开始，显示24小时
      for (let h = 0; h < 24; h += mode.step) {
        const date = new Date(today)
        date.setDate(today.getDate() + d)
        date.setHours(startHour + h)
        ticks.push({
          date: date.toISOString(),
          upperLabel: mode.upperFormat(date),
          lowerLabel: mode.lowerFormat(date)
        })
      }
    }
  } else if (mode.unit === 'day') {
    // 天模式 - 也支持小时偏移
    const startHour = mode.dayStartHour ?? 0

    for (let d = options.value.startDay; d <= options.value.endDay; d += mode.step) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      date.setHours(startHour)
      ticks.push({
        date: date.toISOString(),
        upperLabel: mode.upperFormat(date),
        lowerLabel: mode.lowerFormat(date)
      })
    }
  } else if (mode.unit === 'month') {
    // 月模式 - 也支持小时偏移
    const startHour = mode.dayStartHour ?? 0
    const startDate = new Date(today)
    startDate.setMonth(today.getMonth() + options.value.startDay)
    startDate.setHours(startHour)
    const endDate = new Date(today)
    endDate.setMonth(today.getMonth() + options.value.endDay)

    const current = new Date(startDate)
    while (current <= endDate) {
      ticks.push({
        date: current.toISOString(),
        upperLabel: mode.upperFormat(current),
        lowerLabel: mode.lowerFormat(current)
      })
      current.setMonth(current.getMonth() + mode.step)
    }
  }

  return ticks
})

// 生成上层分组（合并相同的上层标签）
const upperGroups = computed(() => {
  const groups = []
  const ticks = timeTicks.value
  const mode = viewModeConfig.value

  if (ticks.length === 0) return groups

  // 对于小时模式，如果有 dayStartHour，需要按照偏移后的"天"来分组
  if (mode.unit === 'hour' && mode.dayStartHour) {
    let currentDayStart = 0

    while (currentDayStart < ticks.length) {
      const ticksPerDay = 24 / mode.step
      const span = Math.min(ticksPerDay, ticks.length - currentDayStart)

      // 使用这一天开始时刻的日期作为标签
      const startTick = ticks[currentDayStart]
      groups.push({
        key: startTick.upperLabel + '_' + currentDayStart,
        label: startTick.upperLabel,
        span: span
      })

      currentDayStart += ticksPerDay
    }
  } else {
    // 其他模式：简单合并相同的上层标签
    let currentGroup = {
      key: ticks[0].upperLabel + '_0',
      label: ticks[0].upperLabel,
      span: 1
    }

    for (let i = 1; i < ticks.length; i++) {
      if (ticks[i].upperLabel === currentGroup.label) {
        currentGroup.span++
      } else {
        groups.push(currentGroup)
        currentGroup = {
          key: ticks[i].upperLabel + '_' + i,
          label: ticks[i].upperLabel,
          span: 1
        }
      }
    }
    groups.push(currentGroup)
  }

  return groups
})

const svgWidth = computed(() => timeTicks.value.length * viewModeConfig.value.tickWidth)

const svgHeight = computed(() => props.resources.length * options.value.rowHeight)

const baseDate = computed(() =>
  timeTicks.value.length ? new Date(timeTicks.value[0].date) : new Date()
)

const computedTasks = computed(() =>
  timeTicks.value.length ? props.tasks : []
)

// 计算当前时间线的位置
const currentTimeLine = computed(() => {
  const mode = viewModeConfig.value
  const ticks = timeTicks.value

  if (ticks.length === 0) return null

  const now = new Date()
  const baseDate = new Date(ticks[0].date)

  let x = 0

  if (mode.unit === 'hour') {
    const hoursDiff = (now - baseDate) / 3600000
    x = (hoursDiff / mode.step) * mode.tickWidth
  } else if (mode.unit === 'day') {
    const daysDiff = (now - baseDate) / 86400000
    x = (daysDiff / mode.step) * mode.tickWidth
  } else if (mode.unit === 'month') {
    const monthsDiff = (now.getFullYear() - baseDate.getFullYear()) * 12 +
                      (now.getMonth() - baseDate.getMonth())
    x = (monthsDiff / mode.step) * mode.tickWidth
  }

  // 只在可见范围内显示
  if (x < 0 || x > svgWidth.value) return null

  return x
})

const emit = defineEmits(['task-click', 'task-move'])

// 滚动到当前时间
onMounted(() => {
  if (ganttWrapper.value && currentTimeLine.value !== null) {
    const scrollLeft = currentTimeLine.value - ganttWrapper.value.clientWidth / 2
    ganttWrapper.value.scrollLeft = Math.max(0, scrollLeft)
  }
})
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.gantt-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-mode-selector {
  display: flex;
  gap: 8px;
  padding: 10px;
  background-color: #f8fafc;
  border-bottom: 1px solid #cbd5e1;
}

.mode-button {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  background-color: #fff;
  color: #475569;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-button:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

.mode-button.active {
  background-color: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.gantt-wrapper {
  display: grid;
  grid-template-columns: 150px max-content;
  grid-template-rows: 60px max-content;
  width: 100%;
  height: 100%;
  overflow: auto;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.gantt-corner {
  grid-column: 1;
  grid-row: 1;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 10;
  background-color: #e2e8f0;
  border-right: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 13px;
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.05);
}

.gantt-timeline {
  grid-column: 2;
  grid-row: 1;
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
  border-bottom: 1px solid #cbd5e1;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.05);
}

.timeline-upper {
  display: flex;
  height: 30px;
  border-bottom: 1px solid #e2e8f0;
}

.time-group {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  border-right: 1px solid #cbd5e1;
  background-color: #f1f5f9;
}

.timeline-lower {
  display: flex;
  height: 30px;
}

.time-tick {
  width: var(--tick-width, 100px);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #475569;
  border-right: 1px solid #e2e8f0;
}

.gantt-resources {
  grid-column: 1;
  grid-row: 2;
  position: sticky;
  left: 0;
  z-index: 5;
  background-color: #fff;
  border-right: 1px solid #cbd5e1;
  box-shadow: 2px 0 3px rgba(0, 0, 0, 0.05);
}

.resource-item {
  height: var(--row-height, 40px);
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 500;
}

.gantt-data {
  grid-column: 2;
  grid-row: 2;
  line-height: 0;
}

.current-time-line {
  stroke: #000;
  stroke-width: 2;
  pointer-events: none;
}
</style>
