<template>
  <div class="app">
    <div class="sidebar">
      <TaskEditForm
        v-if="selectedTask"
        :task="selectedTask"
        @update-task="onUpdateTask"
        @delete-task="onDeleteTask"
        @close="selectedTask = null"
      />
      <TaskForm v-else @add-task="onAddTask" :tasks="tasks" />
    </div>
    <div class="main">
      <GanttChart :resources="resources" :tasks="tasks" :options="options" @task-click="onTaskClick" @task-move="onTaskMove" style="width: 100%; height: 100%;" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import GanttChart from './components/gantt/GanttChart.vue'
import TaskForm from './components/TaskForm.vue'
import TaskEditForm from './components/TaskEditForm.vue'
import { PRODUCT_MASTER } from './data/productMaster'
import type { Task } from './models'

const TASKS_STORAGE_KEY = 'schedule-assistant.tasks'

const options = {
  view_mode: 'HOUR_2',
  show_current_time: true,
  rowHeight: 80
}

// 从 PRODUCT_MASTER 提取唯一设备列表作为甘特图资源
const resources = computed(() => {
  const set = new Set(PRODUCT_MASTER.map(item => item.machine))
  return Array.from(set).sort()
})

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map((task) => ({
      ...task,
      // localStorage 里会被序列化成字符串，这里恢复为 Date
      startDate: new Date(task.startDate)
    }))
  } catch {
    return []
  }
}

const tasks = ref<Task[]>(loadTasks())
const selectedTask = ref<Task | null>(null)

watch(
  tasks,
  (nextTasks) => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(nextTasks))
  },
  { deep: true }
)

const onAddTask = (task: Task) => {
  tasks.value.push({ ...task })
}

const onTaskClick = (task: Task) => {
  selectedTask.value = tasks.value.find(t => t.id === task.id) || null
}

const onTaskMove = ({ id, startDate }: { id: number; startDate: Date }) => {
  const task = tasks.value.find(t => t.id === id)
  // 拖拽仅改变开始时间；结束时间由 startDate + duration 推导
  if (task) task.startDate = startDate
}

const onUpdateTask = (changes: Pick<Task, 'id' | 'qty' | 'jobchange' | 'startDate' | 'duration' | 'display'>) => {
  const task = tasks.value.find(t => t.id === changes.id)
  if (!task) return
  Object.assign(task, changes)
  selectedTask.value = null
}

const onDeleteTask = (id: number) => {
  tasks.value = tasks.value.filter(t => t.id !== id)
  selectedTask.value = null
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 360px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 20px;
  border-right: 1px solid #cbd5e1;
  background: #f8fafc;
}

.main {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}
</style>
