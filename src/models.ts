export interface Task {
  id: number
  display: string    // 任务条显示内容，默认 "{product} ({qty}片)"
  product: string
  machine: string
  startDate: Date    // Date 对象
  duration: number   // 分钟，含 jobchange
  qty: number
  tt: number         // 秒/片
  jobchange: number  // 分钟
  type: string       // '1' | '2' | '3'
}
