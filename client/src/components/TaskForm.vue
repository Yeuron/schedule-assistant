<template>
  <div class="task-form">
    <n-card title="新增排产任务">
      <n-form :model="form" label-placement="left" label-width="auto">
        <n-form-item label="产品">
          <n-select
            v-model:value="form.product"
            :options="productOptions"
            placeholder="请选择产品"
            @update:value="onProductChange"
            :disabled="!productOptions.length"
          />
        </n-form-item>

        <n-form-item label="设备">
          <n-radio-group v-model:value="form.machine" @update:value="onMachineChange">
            <n-space vertical>
              <n-radio
                v-for="m in machines"
                :key="m"
                :value="m"
                :disabled="!form.product"
              >
                {{ m }}
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="生产模式">
          <n-radio-group v-model:value="form.type" @update:value="onTypeChange">
            <n-space vertical>
              <n-radio
                v-for="t in types"
                :key="t"
                :value="t"
                :disabled="!form.machine"
              >
                {{ typeNames[t] }}
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="PI液">
          <n-input
            :value="selectedConfig?.pi || ''"
            readonly
            disabled
          />
        </n-form-item>

        <n-form-item label="TT (秒)">
          <n-input
            :value="selectedConfig?.tt || ''"
            readonly
            disabled
          />
        </n-form-item>

        <n-form-item label="稼动">
          <n-input
            :value="selectedConfig ? (selectedConfig.utilization * 100).toFixed(0) + '%' : ''"
            readonly
            disabled
          />
        </n-form-item>

        <n-form-item label="片数 (Qty)">
          <n-input-number
            v-model:value="form.qty"
            :min="0"
            :max="999999"
            placeholder="请输入数量"
          />
        </n-form-item>

        <n-form-item label="显示名称">
          <n-input
            v-model:value="form.display"
            placeholder="任务条显示内容"
            :disabled="!form.product"
          />
        </n-form-item>

        <n-form-item label="JC (min)">
          <n-input-number
            v-model:value="form.jobchange"
            :min="0"
            :max="9999"
            placeholder="0"
          />
        </n-form-item>

        <n-form-item label="开始时间">
          <n-date-picker
            v-model:value="form.startTime"
            type="datetime"
            :disabled="!canSelectTime"
            :max="maxDateTime"
            :time-picker-props="{ minutes: [0, 30], seconds: [0], isSecondDisabled: () => true }"
            format="yyyy-MM-dd HH:mm"
          />
        </n-form-item>

        <n-form-item label="结束时间">
          <n-input
            :value="endTime"
            readonly
            disabled
          />
        </n-form-item>
      </n-form>

      <div class="submit-container">
        <n-button
          type="primary"
          @click="addTask"
          :disabled="!canSubmit"
          block
          strong
        >
          添加任务
        </n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NCard, NForm, NFormItem, NSelect, NRadioGroup, NRadio, NSpace, NInput, NInputNumber, NButton, NDatePicker } from 'naive-ui'
import { api } from '../api'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  },
  resources: {
    type: Array,
    default: () => []
  }
})

const productMaster = ref([])
onMounted(async () => {
  productMaster.value = await api.getProductMaster()
})

const emit = defineEmits(['add-task'])

const typeNames = {
  '1': '常规',
  '2': '混RUN',
  '3': '双Coater'
}

const form = ref({
  product: '',
  machine: '',
  type: '',
  qty: 0,
  jobchange: 0,
  startTime: null,
  display: ''
})

// 获取所有产品列表
const productOptions = computed(() => {
  const set = new Set(productMaster.value.map(item => item.product))
  return Array.from(set).sort().map(p => ({ label: p, value: p }))
})

// 根据选中的产品，获取可用设备（仅限 resources 配置中的机台）
const machines = computed(() => {
  if (!form.value.product) return []
  const pmMachines = new Set(
    productMaster.value
      .filter(item => item.product === form.value.product)
      .map(item => item.machine)
  )
  return props.resources.filter(r => pmMachines.has(r.name)).map(r => r.name)
})

// 根据选中的产品和设备，获取可用生产模式
const types = computed(() => {
  if (!form.value.product || !form.value.machine) return []
  const set = new Set(
    productMaster.value
      .filter(item => item.product === form.value.product && item.machine === form.value.machine)
      .map(item => item.type)
  )
  return Array.from(set).sort()
})

// 获取当前选中的配置
const selectedConfig = computed(() => {
  if (!form.value.product || !form.value.machine || !form.value.type) return null
  return productMaster.value.find(
    item => item.product === form.value.product &&
            item.machine === form.value.machine &&
            item.type === form.value.type
  )
})

// 计算结束时间的 Date 对象（用于显示和校验）
const endDateValue = computed(() => {
  if (!selectedConfig.value || form.value.qty == null || !form.value.startTime) return null
  const { tt, utilization } = selectedConfig.value
  const productionMinutes = (form.value.qty * tt) / utilization / 60
  const productionEnd = snapToHalfHour(form.value.startTime + productionMinutes * 60000)
  return new Date(productionEnd + form.value.jobchange * 60000)
})

// 结束时间显示字符串
const endTime = computed(() => {
  if (!endDateValue.value) return ''
  return endDateValue.value.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const canSubmit = computed(() => {
  return form.value.product && form.value.machine && form.value.type &&
         form.value.startTime !== null &&
         form.value.display.trim() !== '' &&
         endDateValue.value !== null &&
         endDateValue.value.getTime() > form.value.startTime
})

const canSelectTime = computed(() => {
  return form.value.product && form.value.machine && form.value.type
})

const maxDateTime = computed(() => {
  return Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后
})

const onProductChange = () => {
  form.value.machine = ''
  form.value.type = ''
  form.value.display = form.value.product ? `${form.value.product} (${form.value.qty}片)` : ''
}

const onMachineChange = () => {
  form.value.type = ''
}

const onTypeChange = () => {
  updateDefaultStartTime()
}

const updateDefaultStartTime = () => {
  if (!form.value.machine) return

  const machineTasks = props.tasks.filter(t => t.machine === form.value.machine)

  if (machineTasks.length === 0) {
    // 没有任务，使用当前时间
    const now = new Date()
    form.value.startTime = snapToHalfHour(now.getTime())
    return
  }

  // 找到最晚的结束时间
  let latestEnd = new Date(0)
  for (const task of machineTasks) {
    const start = task.startDate
    const end = new Date(start.getTime() + task.duration * 60000)
    if (end > latestEnd) {
      latestEnd = end
    }
  }

  // 设置为最晚结束时间
  form.value.startTime = snapToHalfHour(latestEnd.getTime())
}

const snapToHalfHour = (ms) => {
  return Math.ceil(ms / 1800000) * 1800000
}


const addTask = () => {
  if (!canSubmit.value || !selectedConfig.value) return

  const { tt, utilization } = selectedConfig.value
  const start = form.value.startTime  // number (ms)
  const rawProductionEnd = start + (form.value.qty * tt) / utilization / 60 * 60000
  const snappedProductionEnd = snapToHalfHour(rawProductionEnd)
  const productionDuration = (snappedProductionEnd - start) / 60000
  const totalDuration = form.value.jobchange + productionDuration

  emit('add-task', {
    display: form.value.display,
    product: form.value.product,
    machine: form.value.machine,
    type: form.value.type,
    qty: form.value.qty,
    jobchange: form.value.jobchange,
    startDate: new Date(start),
    duration: totalDuration,
    pi: selectedConfig.value.pi,
    tt: selectedConfig.value.tt,
    utilization: selectedConfig.value.utilization
  })

  // 重置表单
  form.value = {
    product: '',
    machine: '',
    type: '',
    qty: 0,
    jobchange: 0,
    startTime: null,
    display: ''
  }
}
</script>
