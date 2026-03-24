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
      <GanttChart :resources="resources" :tasks="tasks" :options="options" @task-click="onTaskClick" style="width: 100%; height: 100%;" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import GanttChart from './components/gantt/GanttChart.vue'
import TaskForm from './components/TaskForm.vue'
import TaskEditForm from './components/TaskEditForm.vue'
import { PRODUCT_MASTER } from './data/productMaster'
import type { Task } from './models'

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

const tasks = ref<Task[]>([])
const selectedTask = ref<Task | null>(null)

const onAddTask = (task: Task) => {
  tasks.value.push({ ...task })
}

const onTaskClick = (task: Task) => {
  selectedTask.value = tasks.value.find(t => t.id === task.id) || null
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
