# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Schedule-Assistant is a Vue3 Gantt chart component for production scheduling (排产甘特图).

- GitHub: https://github.com/Yeuron/schedule-assistant.git
- Stack: Vue3 + Vite + TypeScript (frontend) / Node.js + Express + OracleDB (backend)

## Directory Structure

```
client/                        # 前端（Vue3 + Vite）
  index.html
  vite.config.js               # 配置了 /api -> localhost:3000 的 proxy
  package.json
  src/
    main.js                    # Vue 入口
    App.vue                    # 顶层：注册 NMessageProvider
    api.js                     # 封装所有后端 API 请求
    models.ts                  # TypeScript 接口（Task 等）
    components/
      AppContent.vue           # 主页面逻辑：tasks/resources 状态、事件处理
      TaskForm.vue             # 新增排产任务表单
      TaskEditForm.vue         # 编辑排产任务表单（:key="selectedTask.id" 强制重建）
      gantt/
        GanttChart.vue         # 甘特图主组件：时间轴 + 任务渲染
        GanttToolbar.vue       # 工具栏组件：视图模式切换 + 今天按钮
        GanttTask.vue          # 单个任务条组件（SVG，支持拖拽）
        defaults.js            # DEFAULT_VIEW_MODES + DEFAULT_OPTIONS
    data/
      productMaster.js         # (已废弃) 静态产品主数据，改由 API 提供
server/                        # 后端（Node.js + Express + OracleDB）
  index.js                     # Express 入口，创建连接池并启动服务
  db.js                        # Oracle 连接池（Thick 模式）
  .env                         # 数据库连接配置（不提交 git）
  .env.example                 # 配置模板
  ddl.sql                      # 建表 SQL
  package.json
  routes/
    productMaster.js           # GET /api/product-master（读 FR_CX_CL_INFO2）
    tasks.js                   # CRUD /api/tasks（读写 FR_CX_SCHEDULE_TASK）
refs/                          # 参考资料
  product-master-data          # 产品主数据原始格式参考
```

## Start Commands

```bash
# 后端
cd server && npm run dev       # http://localhost:3000

# 前端
cd client && npm run dev       # http://localhost:5173 (proxy /api -> :3000)
```

## Database Tables

### FR_CX_CL_INFO2（产品主数据，只读）
| 字段 | 说明 |
|------|------|
| CELL_NO | 产品型号 |
| DEVICE | 设备 |
| TYPE | 生产模式（1/2/3）|
| PI | PI液 |
| TT | 秒/片 |
| OPERATION_RATE | 稼动率（小数，如 0.97）|

### FR_CX_SCHEDULE_TASK（排产任务表）
| 字段 | 说明 |
|------|------|
| ID | 毫秒时间戳字符串（VARCHAR2(13)）|
| DISPLAY | 任务条显示内容 |
| PRODUCT | 产品型号 |
| MACHINE | 设备 |
| TYPE | 生产模式 |
| START_DATE | 开始时间（TIMESTAMP）|
| DURATION | 总时长分钟（含换机）|
| QTY | 片数 |
| TT | 秒/片 |
| JOBCHANGE | 换机时间（分钟）|

## API Endpoints

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/product-master | 产品主数据 |
| GET | /api/tasks | 所有排产任务 |
| POST | /api/tasks | 新增任务 |
| PUT | /api/tasks/:id | 更新任务（只更新传入的字段）|
| DELETE | /api/tasks/:id | 删除任务 |

## Task Object (models.ts)

```ts
interface Task {
  id: string          // 毫秒时间戳字符串
  display: string     // 任务条显示内容
  product: string
  machine: string
  startDate: Date     // Date 对象，不是 ISO 字符串
  duration: number    // 分钟，含 jobchange
  qty: number
  tt: number          // 秒/片
  jobchange: number   // 分钟
  type: string        // '1' | '2' | '3'
}
```

## DEFAULT_OPTIONS

```js
{
  view_mode: 'DAY',
  view_mode_select: true,       // 是否显示视图模式选择器
  view_modes: DEFAULT_VIEW_MODES,
  show_current_time: false,     // 是否显示当前时间竖线（黑色虚线）
  rowHeight: 60,
  startDay: -7,
  endDay: 7,
  barPaddingY: 5,
  today_button: true,           // 是否显示「今天」按钮（滚动到当前时间）
  container_height: 'auto',     // 'auto' 随内容展开，或任意正整数（px）
}
```

## GanttChart Features

- **视图模式切换**：切换时保持视口中心时间不变（`xToTime` / `timeToX` 互转）
- **今天定位**：初始化及点击「今天」按钮时，将当前时间滚动到数据区中央
  - 数据区宽度 = `wrapper.clientWidth - 150`（减去左侧固定资源列 150px）
- **当前 tick 高亮**：下层时间轴中，当前时间所在 tick 显示黑色圆圈 + 白色数字（`currentTickKey`）
- **当前时间线**：落在当前 tick 正中间的黑色虚线（`show_current_time: true` 时显示）
- **GanttToolbar**：已剥离为独立组件，通过 `change-mode` / `scroll-to-today` 事件通信
  - 视图模式按钮等宽（`flex: 1`，外层 `display: flex`）
  - 「今天」按钮靠右（`margin-left: auto`）

## TaskEditForm Notes

- `startTime` 使用毫秒时间戳（`Date.getTime()`），与 NDatePicker v-model 兼容
- AppContent 中使用 `:key="selectedTask.id"` 强制在切换 task 时重建组件

## Conventions

- 前端日期统一使用 Date 对象，API 传输时转为 ISO 字符串
- duration 单位为分钟
- DEFAULT_OPTIONS 配置项用 snake_case，view mode 内部属性用 camelCase
- PUT /api/tasks/:id 只更新 body 中实际传入的字段（partial update）
- 拖拽移动采用乐观更新：先更新本地状态，再异步调用 API
- 保持最小实现，不添加多余代码
