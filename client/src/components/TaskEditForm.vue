<template>
  <div class="task-form">
    <n-card title="修改排产任务">
      <n-form label-placement="left" label-width="auto">
        <n-form-item label="产品">
          <n-input :value="task.product" readonly disabled />
        </n-form-item>

        <n-form-item label="设备">
          <n-input :value="task.machine" readonly disabled />
        </n-form-item>

        <n-form-item label="生产模式">
          <n-input :value="typeNames[task.type] || task.type" readonly disabled />
        </n-form-item>

        <n-form-item label="JC (min)">
          <n-input-number v-model:value="form.jobchange" :min="0" :max="9999" />
        </n-form-item>

        <n-form-item label="片数 (Qty)">
          <n-input-number
            v-model:value="form.qty"
            :min="minQty"
            :max="999999"
          />
        </n-form-item>

        <n-form-item label="显示名称">
          <n-input v-model:value="form.display" />
        </n-form-item>

        <n-form-item label="开始时间">
          <n-date-picker
            v-model:value="form.startTime"
            type="datetime"
          />
        </n-form-item>

        <n-form-item label="结束时间">
          <n-input :value="endTime" readonly disabled />
        </n-form-item>
      </n-form>

      <div class="button-group">
        <n-button type="primary" :disabled="!canSave" block strong @click="save">
          保存
        </n-button>
        <n-popconfirm @positive-click="deleteTask">
          <template #trigger>
            <n-button type="error" block strong>删除任务</n-button>
          </template>
          确定要删除该任务吗？
        </n-popconfirm>
        <n-button block @click="$emit('close')">取消</n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NCard, NForm, NFormItem, NInput, NInputNumber, NButton, NDatePicker, NPopconfirm } from 'naive-ui'
import { api } from '../api'

const props = defineProps({
  task: { type: Object, required: true },
  resources: { type: Array, default: () => [] }
})

const productMaster = ref([])
onMounted(async () => {
  productMaster.value = await api.getProductMaster()
})

const emit = defineEmits(['update-task', 'delete-task', 'close'])

const typeNames = {
  '1': '常规',
  '2': '混RUN',
  '3': '双Coater'
}

const form = ref({
  qty: props.task.qty,
  jobchange: props.task.jobchange || 0,
  startTime: props.task.startDate instanceof Date ? props.task.startDate.getTime() : (props.task.startDate || null),
  display: props.task.display
})

const utilization = computed(() =>
  productMaster.value.find(
    item => item.product === props.task.product &&
            item.machine === props.task.machine &&
            item.type === props.task.type
  )?.utilization ?? 1
)

const minQty = computed(() => Math.ceil(30 * utilization.value * 60 / props.task.tt))

const endTime = computed(() => {
  if (!form.value.qty || !form.value.startTime) return ''
  const productionMinutes = (form.value.qty * props.task.tt) / utilization.value / 60
  const startMs = form.value.startTime
  const productionEnd = new Date(Math.ceil((startMs + productionMinutes * 60000) / 1800000) * 1800000)
  const end = new Date(productionEnd.getTime() + form.value.jobchange * 60000)
  return end.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
})

const canSave = computed(() => form.value.qty >= minQty.value && form.value.startTime !== null)

const save = () => {
  const start = new Date(form.value.startTime)
  const rawProductionEnd = new Date(start.getTime() + (form.value.qty * props.task.tt) / utilization.value / 60 * 60000)
  const snappedProductionEnd = new Date(Math.ceil(rawProductionEnd.getTime() / 1800000) * 1800000)
  const productionDuration = (snappedProductionEnd.getTime() - start.getTime()) / 60000
  const duration = form.value.jobchange + productionDuration
  emit('update-task', {
    id: props.task.id,
    qty: form.value.qty,
    jobchange: form.value.jobchange,
    startDate: start,
    duration,
    display: form.value.display
  })
}

const deleteTask = () => {
  emit('delete-task', props.task.id)
}
</script>

<style scoped>
.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
</style>
