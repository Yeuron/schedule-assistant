<template>
  <div style="padding: 20px">
    <GanttChart :resources="resources" :tasks="tasks" :options="options" style="width: 100%; height: 300px;" />
  </div>
</template>

<script setup>
import GanttChart from './components/gantt/GanttChart.vue'

const options = {
  viewMode: 'HOUR_2', // 可选: 'HOUR', 'HOUR_2', 'DAY', 'WEEK', 'MONTH'
  // rowHeight: 50
}

const resources = [
  'CNC 加工中心 A',
  'CNC 加工中心 B',
  '装配线 1',
  '装配线 2',
  '质检工位 1',
  '质检工位 2',
  '打包线 A',
  '打包线 B'
]

const today = new Date()
today.setHours(0, 0, 0, 0)

const getDateISO = (daysOffset) => {
  const date = new Date(today)
  date.setDate(today.getDate() + daysOffset)
  return date.toISOString()
}

const tasks = [
  { id: '1', name: '订单 PO-101 (粗加工)', resourceIndex: 0, startDate: getDateISO(-5), duration: 2880, color: '#3b82f6' },
  { id: '2', name: '订单 PO-099 (延期)', resourceIndex: 0, startDate: getDateISO(-2), duration: 4320, color: '#ef4444' },
  { id: '3', name: '订单 PO-102 (外壳打磨)', resourceIndex: 1, startDate: getDateISO(-4), duration: 4320, color: '#10b981' },
  { id: '4', name: '设备保养维护', resourceIndex: 1, startDate: getDateISO(2), duration: 2880, color: '#f59e0b' },
  { id: '5', name: '订单 PO-100 (总装)', resourceIndex: 2, startDate: getDateISO(-1), duration: 2880, color: '#6366f1' },
  { id: '6', name: '订单 PO-101 (总装)', resourceIndex: 2, startDate: getDateISO(3), duration: 4320, color: '#8b5cf6' },
  { id: '7', name: '订单 PO-103 (装配)', resourceIndex: 3, startDate: getDateISO(-6), duration: 5760, color: '#ec4899' },
  { id: '8', name: '订单 PO-104 (装配)', resourceIndex: 3, startDate: getDateISO(1), duration: 4320, color: '#14b8a6' },
  { id: '9', name: '订单 PO-105 (质检)', resourceIndex: 4, startDate: getDateISO(-3), duration: 2880, color: '#f97316' },
  { id: '10', name: '订单 PO-106 (质检)', resourceIndex: 4, startDate: getDateISO(0), duration: 5760, color: '#06b6d4' },
  { id: '11', name: '订单 PO-107 (质检)', resourceIndex: 5, startDate: getDateISO(-5), duration: 7200, color: '#84cc16' },
  { id: '12', name: '订单 PO-108 (质检)', resourceIndex: 5, startDate: getDateISO(2), duration: 4320, color: '#a855f7' },
  { id: '13', name: '订单 PO-109 (打包)', resourceIndex: 6, startDate: getDateISO(-2), duration: 4320, color: '#22c55e' },
  { id: '14', name: '订单 PO-110 (打包)', resourceIndex: 6, startDate: getDateISO(4), duration: 2880, color: '#eab308' },
  { id: '15', name: '订单 PO-111 (打包)', resourceIndex: 7, startDate: getDateISO(-4), duration: 4320, color: '#3b82f6' },
  { id: '16', name: '订单 PO-112 (打包)', resourceIndex: 7, startDate: getDateISO(1), duration: 5760, color: '#f43f5e' }
]
</script>
