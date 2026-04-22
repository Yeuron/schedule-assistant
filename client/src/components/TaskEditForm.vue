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

        <n-form-item label="备注">
          <n-input v-model:value="form.remark" placeholder="可选备注" />
        </n-form-item>

        <n-form-item label="开始时间">
          <n-date-picker
            v-model:value="form.startTime"
            type="datetime"
            :time-picker-props="{ minutes: [0, 30], format: 'HH:mm' }"
            format="yyyy-MM-dd HH:mm"
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
import { api, timeUtils } from '../api'

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
  remark: props.task.remark || ''
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
  const productionMs = (form.value.qty * props.task.tt / utilization.value) * 1000
  const jcMs = (form.value.jobchange || 0) * 60000
  // 生产 + JC 的总结束时间，最后对齐到 30 分钟
  const rawEnd = form.value.startTime + productionMs + jcMs
  const alignedEnd = new Date(Math.ceil(rawEnd / 1800000) * 1800000)
  return alignedEnd.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
})

const canSave = computed(() => form.value.qty >= minQty.value && form.value.startTime !== null)

const save = () => {
  const start = new Date(form.value.startTime)
  const productionMs = (form.value.qty * props.task.tt / utilization.value) * 1000
  const jcMs = (form.value.jobchange || 0) * 60000
  // 生产 + JC 的总结束时间，最后对齐到 30 分钟
  const alignedEnd = Math.ceil((start.getTime() + productionMs + jcMs) / 1800000) * 1800000
  const duration = (alignedEnd - start.getTime()) / 60000
  
  emit('update-task', {
    id: props.task.id,
    qty: form.value.qty,
    jobchange: form.value.jobchange,
    startDate: start,
    duration,
    remark: form.value.remark
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
