# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Schedule-Assistant is a Vue3 Gantt chart component for production scheduling (排产甘特图).

- GitHub: https://github.com/Yeuron/schedule-assistant.git
- Stack: Vue3 + Vite + TypeScript
- Run: `npm run dev`

## File Structure

```
src/
  App.vue                      # Main app: manages tasks array, handles add/update/delete
  components/
    TaskForm.vue               # New task creation form
    TaskEditForm.vue           # Task editing form
    gantt/
      GanttChart.vue           # Main Gantt component: renders timeline + tasks
      GanttTask.vue            # Individual task bar component
      defaults.js              # DEFAULT_VIEW_MODES + DEFAULT_OPTIONS
  models.ts                    # TypeScript interfaces (Task, etc.)
  main.js                      # Vue app entry
appendix/
  defaults.js                  # User's reference/scratch file
gantt-chart.html               # Original HTML prototype
```

## Core Components Logic

### App.vue
- Holds reactive `tasks` array (Task[])
- Handles events: `add-task`, `update-task`, `delete-task`, `task-click`, `task-move`
- Passes `tasks`, `resources`, `options` to GanttChart
- Opens TaskForm/TaskEditForm modals
- On `task-move`, updates `task.startDate` only (end time is derived from duration)

### TaskForm.vue & TaskEditForm.vue
- Use Naive UI forms (n-form, n-date-picker, n-input-number)
- Emit Date objects directly (no ISO string conversion)
- TaskForm: creates new task with default start time
- TaskEditForm: initializes form from existing task.startDate

### GanttChart.vue
- Merges props.options with DEFAULT_OPTIONS
- Manages `viewMode` ref (string key like 'DAY')
- Computes `viewModeConfig` from options.view_modes[viewMode]
- Generates `timeTicks` array based on view mode and date range
- Computes `upperGroups` for timeline header grouping
- Renders SVG with grid + GanttTask components
- Forwards child move event: `GanttTask@move` -> emit `task-move`
- Handles view mode switching UI
- Auto-scrolls to current time on mount

### GanttTask.vue
- Receives `task` (Task), `viewModeConfig` (object), `baseDate` (Date)
- Computes x position: (task.startDate - baseDate) / timeUnit * tickWidth
- Computes width: task.duration / timeUnit * tickWidth
- Renders SVG rect with task color and padding
- Supports horizontal drag move with pointer events
- Snap-to-grid at 30 minutes (minimum move unit)
- Emits `move` with `{ id, startDate }` on drag end
- Suppresses click after drag to avoid accidental edit popup

## Data Flow

1. User creates/edits task via forms → emit to App.vue → update tasks array
2. App.vue passes tasks to GanttChart → renders GanttTask components
3. User drags task bar in GanttTask → emit `move` (`id`, `startDate`) after 30-minute snapping
4. GanttChart forwards `task-move` to App.vue
5. App.vue updates matching task `startDate`; end time shifts accordingly via unchanged `duration`
6. View mode changes → update viewMode → recompute timeTicks → re-render

## GanttChart Component API

Props:
- `resources`: Array (required) - list of resource name strings
- `tasks`: Array (required) - task objects
- `options`: Object - merged with DEFAULT_OPTIONS

Task object shape (from models.ts):
```ts
interface Task {
  id: number
  display: string
  product: string
  machine: string
  startDate: Date        // Date object, not ISO string
  duration: number       // minutes
  qty: number
  tt: number             // seconds per piece
  jobchange: number      // minutes
  type: string           // '1' | '2' | '3'
}
```

## DEFAULT_OPTIONS

```js
{
  view_mode: 'DAY',            // current view mode key
  view_mode_select: true,      // show view mode switcher UI
  view_modes: DEFAULT_VIEW_MODES,
  show_current_time: false,    // show black vertical line at current time
  rowHeight: 40,
  startDay: -7,                // days offset from today
  endDay: 7,
  barPaddingY: 5,
}
```

## DEFAULT_VIEW_MODES

Keys: `HOUR`, `HOUR_2`, `HOUR_6`, `DAY`, `WEEK`, `MONTH`

Each mode has:
```js
{
  name, tickWidth, step, unit,  // unit: 'hour' | 'day' | 'month'
  dayStartHour,                 // all modes have this; shifts timeline start hour
  upperFormat(date),            // top row label formatter
  lowerFormat(date),            // bottom row label formatter
}
```

## Timeline Generation Logic

- `timeTicks`: Array of {date: Date, upperLabel: string, lowerLabel: string}
- For hour modes: generate ticks every `step` hours, starting from `dayStartHour`
- For day/month modes: generate ticks every `step` days/months
- `upperGroups`: Merge consecutive ticks with same `upperLabel`
- SVG width = timeTicks.length * viewModeConfig.tickWidth
- SVG height = resources.length * options.rowHeight

## Task Positioning Logic

- Base date = timeTicks[0].date
- Time unit conversion: hour=3600000ms, day=86400000ms, month=approx 30.44 days
- X position = ((task.startDate - baseDate) / timeUnit) * tickWidth / step
- Width = (task.duration / 60 / timeUnit) * tickWidth / step  // duration in minutes

## Current Time Line

- Calculates position relative to baseDate using same time unit logic
- Only shows if within visible range (x >=0 && x <= svgWidth)

## Conventions

- 日期统一使用 Date 对象（不再是 ISO 字符串）
- duration 单位为分钟
- DEFAULT_OPTIONS 配置项用 snake_case
- view mode 内部属性用 camelCase
- 组件间传递 Date 对象，避免重复转换
- 保持最小实现，不添加多余代码
