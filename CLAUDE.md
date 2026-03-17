# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Schedule-Assistant is a Vue3 Gantt chart component for production scheduling (排产甘特图).

- GitHub: https://github.com/Yeuron/schedule-assistant.git
- Stack: Vue3 + Vite
- Run: `npm run dev`

## File Structure

```
src/
  App.vue                      # Demo entry
  components/
    gantt/
      GanttChart.vue           # Main Gantt component
      defaults.js              # DEFAULT_VIEW_MODES + DEFAULT_OPTIONS
appendix/
  defaults.js                  # User's reference/scratch file
gantt-chart.html               # Original HTML prototype
```

## GanttChart Component API

Props:
- `resources`: Array (required) - list of resource name strings
- `tasks`: Array (required) - task objects
- `options`: Object - merged with DEFAULT_OPTIONS

Task object shape:
```js
{ id, name, resourceIndex, startDate: 'ISO8601', duration: minutes, color }
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

## GanttChart Internal Logic

- `options` = computed merge of DEFAULT_OPTIONS + props.options
- `internalViewMode` = ref, initialized from options.view_mode, changed by UI buttons
- `currentViewMode` = options.view_modes[internalViewMode]
- Timeline is 2-row: upper (grouped by upperFormat) + lower (per tick)
- SVG renders: grid pattern + task bars + current time line
- `ganttWrapper` ref used for auto-scroll to current time on mount
- CSS variables: `--tick-width`, `--row-height` on `.gantt-wrapper`

## Conventions

- 日期使用 ISO 8601 字符串（如 `2026-03-17T06:00:00.000Z`）
- duration 单位为分钟
- DEFAULT_OPTIONS 配置项用 snake_case
- view mode 内部属性用 camelCase
- 保持最小实现，不添加多余代码
