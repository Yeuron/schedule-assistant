<template>
  <div class="app">
    <div class="sidebar">
      <TaskEditForm
        v-if="selectedTask"
        :key="selectedTask.id"
        :task="selectedTask"
        :resources="resources"
        @update-task="onUpdateTask"
        @delete-task="onDeleteTask"
        @close="selectedTask = null"
      />
      <TaskForm v-else @add-task="onAddTask" :tasks="tasks" :resources="resources" />
    </div>
    <div class="main">
      <div class="gantt-section">
        <GanttChart :resources="resources" :tasks="tasks" :options="options" @task-click="onTaskClick" @task-move="onTaskMove" />
      </div>
      <div class="table-section">
        <DailyQtyTable :tasks="tasks" :resources="resources" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import GanttChart from './gantt/GanttChart.vue'
import TaskForm from './TaskForm.vue'
import TaskEditForm from './TaskEditForm.vue'
import DailyQtyTable from './DailyQtyTable.vue'
import { api } from '../api'
import type { Task } from '../models'
import { RESOURCES } from '../config/resources'

const options = {
  view_mode: 'HOUR_2',
  show_current_time: true,
  // container_height: 500,
}

const message = useMessage()
const tasks = ref<Task[]>([])
const selectedTask = ref<Task | null>(null)

const resources = RESOURCES

onMounted(async () => {
  const ts = await api.getTasks()
  tasks.value = ts.map((t: any) => ({ ...t, startDate: new Date(t.startDate) }))
})

const onAddTask = async (taskData: Omit<Task, 'id'>) => {
  const { id } = await api.createTask({
    ...taskData,
    startDate: (taskData.startDate as Date).toISOString()
  })
  tasks.value.push({ ...taskData, id })
}

const onTaskClick = (task: Task) => {
  selectedTask.value = tasks.value.find(t => t.id === task.id) || null
}

const onTaskMove = ({ id, startDate }: { id: string; startDate: Date }) => {
  const task = tasks.value.find(t => t.id === id)
  if (!task) return
  task.startDate = startDate
  api.updateTask(id, { startDate: startDate.toISOString() })
    .then(() => message.success('保存成功'))
    .catch(() => message.error('保存失败'))
}

const onUpdateTask = async (changes: Pick<Task, 'id' | 'qty' | 'jobchange' | 'startDate' | 'duration' | 'display'>) => {
  const task = tasks.value.find(t => t.id === changes.id)
  if (!task) return
  await api.updateTask(changes.id, {
    ...changes,
    startDate: (changes.startDate as Date).toISOString()
  })
  Object.assign(task, changes)
  selectedTask.value = null
  message.success('保存成功')
}

const onDeleteTask = async (id: string) => {
  await api.deleteTask(id)
  tasks.value = tasks.value.filter(t => t.id !== id)
  selectedTask.value = null
  message.success('删除成功')
}
</script>

<style scoped>
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
  min-width: 0;
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gantt-section {
  flex-shrink: 0;
}

.table-section {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
