<template>
  <div class="gantt-container">
    <!-- 工具栏 -->
    <GanttToolbar
      :options="options"
      :viewMode="viewMode"
      @change-mode="changeViewMode"
      @scroll-to-today="scrollToToday"
    />

    <div
      class="gantt-wrapper"
      ref="ganttWrapper"
      :style="{
        '--tick-width': `${viewModeConfig.tickWidth}px`,
        '--row-height': `${options.rowHeight}px`,
        '--resource-col-width': `${options.resource_col_width}px`,
        height: options.container_height === 'auto' ? 'max-content' : `${options.container_height}px`
      }"
    >
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
        <div v-for="tick in timeTicks" :key="tick.key" class="time-tick">
          <span v-if="tick.key === currentTickKey" class="current-tick-label">{{ tick.lowerLabel }}</span>
          <template v-else>{{ tick.lowerLabel }}</template>
        </div>
      </div>
    </div>

    <div class="gantt-resources">
      <div v-for="resource in resources" :key="resource.name" class="resource-item">
        {{ resource.name }}
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
          class="current-time-line"
          :x1="currentTimeLine"
          :y1="0"
          :x2="currentTimeLine"
          :y2="svgHeight"
        />
      </svg>
    </div>
  </div>
  </div>

</template>

<script setup>
import { computed, nextTick, ref, onMounted } from 'vue'
import { DEFAULT_OPTIONS } from './defaults'
import GanttToolbar from './GanttToolbar.vue'
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

// 将 x 偏移量（像素）转换为对应的时间点
const xToTime = (x, config, base) => {
  if (config.unit === 'hour') {
    return new Date(base.getTime() + (x / config.tickWidth) * config.step * 3600000)
  } else if (config.unit === 'day') {
    return new Date(base.getTime() + (x / config.tickWidth) * config.step * 86400000)
  } else {
    // month：用近似毫秒数
    return new Date(base.getTime() + (x / config.tickWidth) * config.step * 30.44 * 86400000)
  }
}

// 将时间点转换为 x 偏移量（像素）
const timeToX = (time, config, base) => {
  if (config.unit === 'hour') {
    return ((time - base) / 3600000 / config.step) * config.tickWidth
  } else if (config.unit === 'day') {
    return ((time - base) / 86400000 / config.step) * config.tickWidth
  } else {
    const months = (time.getFullYear() - base.getFullYear()) * 12 + (time.getMonth() - base.getMonth())
    return (months / config.step) * config.tickWidth
  }
}

// 切换视图模式，并将视口中心时间保持不变
const changeViewMode = async (mode) => {
  const wrapper = ganttWrapper.value
  // 数据区可视宽度（减去左侧固定资源列）
  const dataWidth = wrapper ? wrapper.clientWidth - options.value.resource_col_width : 0
  // 记录切换前视口中心对应的时间
  const centerX = wrapper ? wrapper.scrollLeft + dataWidth / 2 : 0
  const centerTime = xToTime(centerX, viewModeConfig.value, baseDate.value)

  viewMode.value = mode

  await nextTick()

  if (wrapper) {
    const newX = timeToX(centerTime, viewModeConfig.value, baseDate.value)
    wrapper.scrollLeft = Math.max(0, newX - dataWidth / 2)
  }
}

const createTick = (date, mode) => ({
  key: date.getTime(),
  date,
  upperLabel: mode.upperFormat(date),
  lowerLabel: mode.lowerFormat(date)
})

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
        ticks.push(createTick(date, mode))
      }
    }
  } else if (mode.unit === 'day') {
    // 天模式 - 也支持小时偏移
    const startHour = mode.dayStartHour ?? 0

    for (let d = options.value.startDay; d <= options.value.endDay; d += mode.step) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      date.setHours(startHour)
      ticks.push(createTick(date, mode))
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
      ticks.push(createTick(new Date(current), mode))
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
  timeTicks.value.length ? timeTicks.value[0].date : new Date()
)

const computedTasks = computed(() =>
  timeTicks.value.length ? props.tasks : []
)

// 当前时间落在哪个 tick
const currentTickKey = computed(() => {
  const ticks = timeTicks.value
  const now = new Date()
  for (let i = 0; i < ticks.length; i++) {
    const start = ticks[i].date
    const end = ticks[i + 1] ? ticks[i + 1].date : new Date(start.getTime() + 1)
    if (now >= start && now < end) return ticks[i].key
  }
  return null
})

// 计算当前时间线的位置（落在哪个 tick，就居中对齐到该 tick 中心）
const currentTimeLine = computed(() => {
  const ticks = timeTicks.value
  if (ticks.length === 0) return null

  const idx = ticks.findIndex(t => t.key === currentTickKey.value)
  if (idx === -1) return null

  return idx * viewModeConfig.value.tickWidth + viewModeConfig.value.tickWidth / 2
})

const emit = defineEmits(['task-click', 'task-move'])

// 滚动到今天
const scrollToToday = () => {
  if (!ganttWrapper.value) return
  const dataWidth = ganttWrapper.value.clientWidth - options.value.resource_col_width
  const x = timeToX(new Date(), viewModeConfig.value, baseDate.value)
  ganttWrapper.value.scrollLeft = Math.max(0, x - dataWidth / 2)
}

// 初始滚动到今天
onMounted(() => {
  if (ganttWrapper.value) {
    scrollToToday()
  }
})
</script>

<style scoped>


.gantt-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gantt-wrapper {
  display: grid;
  grid-template-columns: var(--resource-col-width, 150px) max-content;
  grid-template-rows: 60px max-content;
  width: 100%;
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

.current-tick-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: #000;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
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
  justify-content: center;
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
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
  pointer-events: none;
}
</style>
