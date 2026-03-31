<template>
  <div v-if="products.length && dates.length" class="daily-qty-table-wrap">
    <table class="daily-qty-table">
      <thead>
        <!-- 月份行 -->
        <tr>
          <th class="corner-cell">产品 \ 日期</th>
          <th
            v-for="m in months"
            :key="m.month"
            :colspan="m.dates.length"
            class="month-header"
          >
            {{ m.month }}
          </th>
        </tr>
        <!-- 日期行 -->
        <tr>
          <th class="corner-cell"></th>
          <th v-for="d in dates" :key="d" class="date-header">{{ d.slice(8) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product">
          <td class="product-cell">{{ product }}</td>
          <td v-for="d in dates" :key="d" class="qty-cell">
            <template v-if="cellData[product + '|' + d]">
              <div
                v-for="entry in cellData[product + '|' + d]"
                :key="entry.machine"
                class="qty-chip"
                :style="{ backgroundColor: entry.color }"
                :title="entry.machine"
              >
                {{ entry.qty.toLocaleString() }}
              </div>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task, Resource } from '../models'

const props = defineProps<{
  tasks: Task[]
  resources: Resource[]
}>()

function machineColor(machine: string) {
  const res = props.resources.find(r => r.name === machine)
  return res ? res.color : '#3b82f6'
}

// 将时间转换为生产日（早6点到第二天早6点）的 YYYY-MM-DD 字符串
function mfgDay(date: Date): string {
  const shifted = new Date(date.getTime() - 6 * 3600000)
  const y = shifted.getFullYear()
  const m = String(shifted.getMonth() + 1).padStart(2, '0')
  const d = String(shifted.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 将一个跨天的 task 按照生产日切割，返回 { day, qty } 列表
// qty 按时间比例分配，最后一段取余量保证总数不变
function splitTask(task: Task): { day: string; qty: number }[] {
  const startMs = task.startDate.getTime()
  const endMs = startMs + task.duration * 60000
  if (endMs <= startMs) return []

  const results: { day: string; qty: number }[] = []

  // 找到第一个生产日的 6AM 起点
  const firstDay = mfgDay(task.startDate)
  const [fy, fm, fd] = firstDay.split('-').map(Number)
  let dayStartMs = new Date(fy, fm - 1, fd, 6, 0, 0, 0).getTime()

  let accumulated = 0 // 已分配的累计 qty（精确浮点）
  let cursor = startMs

  while (cursor < endMs) {
    const dayEndMs = dayStartMs + 24 * 3600000
    const sliceEnd = Math.min(endMs, dayEndMs)
    const sliceFraction = (sliceEnd - cursor) / (endMs - startMs)
    const day = mfgDay(new Date(cursor + 1)) // +1ms 避免恰好在边界时取前一天

    const rawQty = accumulated + sliceFraction * task.qty
    const assignedQty = sliceEnd >= endMs
      ? task.qty - Math.round(accumulated) // 最后一段：用余量保证总和
      : Math.round(rawQty) - Math.round(accumulated)

    if (assignedQty > 0) results.push({ day, qty: assignedQty })

    accumulated += sliceFraction * task.qty
    cursor = dayEndMs
    dayStartMs = dayEndMs
  }

  return results
}

// 聚合：{ "product|day": { machine: qty } }
const aggregated = computed(() => {
  const map: Record<string, Record<string, number>> = {}
  for (const task of props.tasks) {
    for (const { day, qty } of splitTask(task)) {
      const key = `${task.product}|${day}`
      if (!map[key]) map[key] = {}
      map[key][task.machine] = (map[key][task.machine] || 0) + qty
    }
  }
  return map
})

// 所有日期：任务涉及的月份，每个月补全所有日期
const dates = computed(() => {
  // 先收集任务涉及的所有月份
  const monthSet = new Set<string>()
  for (const task of props.tasks) monthSet.add(mfgDay(task.startDate).slice(0, 7))

  // 当前月也始终显示
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  monthSet.add(currentMonth)

  const result: string[] = []
  for (const month of Array.from(monthSet).sort()) {
    const [y, m] = month.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(`${month}-${String(d).padStart(2, '0')}`)
    }
  }
  return result
})

// 按月分组日期
const months = computed(() => {
  const map: Record<string, string[]> = {}
  for (const d of dates.value) {
    const month = d.slice(0, 7)
    if (!map[month]) map[month] = []
    map[month].push(d)
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, ds]) => ({ month, dates: ds }))
})

// 所有产品（排序）
const products = computed(() => {
  const set = new Set<string>()
  for (const task of props.tasks) set.add(task.product)
  return Array.from(set).sort()
})

// 渲染用的单元格数据
const cellData = computed(() => {
  const result: Record<string, { machine: string; qty: number; color: string }[]> = {}
  for (const [key, machineMap] of Object.entries(aggregated.value)) {
    result[key] = Object.entries(machineMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([machine, qty]) => ({ machine, qty, color: machineColor(machine) }))
  }
  return result
})
</script>

<style scoped>
.daily-qty-table-wrap {
  overflow-x: auto;
  margin-top: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.daily-qty-table {
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
  width: max-content;
  min-width: 100%;
}

.corner-cell {
  position: sticky;
  left: 0;
  background: #e2e8f0;
  z-index: 2;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  font-size: 12px;
  color: #334155;
  min-width: 120px;
  text-align: center;
}

.month-header {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 4px 8px;
  font-weight: 600;
  color: #334155;
  text-align: center;
}

.date-header {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 4px 6px;
  text-align: center;
  color: #475569;
  min-width: 60px;
}

.product-cell {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 1;
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  font-weight: 500;
  color: #334155;
  white-space: nowrap;
}

.qty-cell {
  border: 1px solid #e2e8f0;
  padding: 3px 4px;
  text-align: center;
  vertical-align: middle;
}

.qty-chip {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  margin: 1px;
}
</style>
