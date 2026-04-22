export interface Resource {
  name: string; // 唯一标识（机台名称）
  color: string; // 任务条颜色
}

export interface Task {
  id: string;
  remark: string; // 用户备注
  product: string;
  machine: string;
  startDate: Date; // Date 对象
  duration: number; // 分钟，含 jobchange
  qty: number;
  tt: number; // 秒/片
  jobchange: number; // 分钟
  type: string; // '1' | '2' | '3'
}
