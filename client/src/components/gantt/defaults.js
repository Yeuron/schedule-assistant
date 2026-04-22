/**
 * 甘特图视图模式配置
 * 参考 Frappe Gantt 的 VIEW_MODES 设计
 */
export const DEFAULT_VIEW_MODES = {
  HOUR: {
    name: "Hour",
    tickWidth: 50,
    step: 1, // 小时
    unit: "hour",
    dayStartHour: 6, // 一天开始时间（早上6点）
    // 上层显示日期，下层显示小时
    upperFormat: (date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${month}-${day}`;
    },
    lowerFormat: (date) => {
      return date.getHours();
    },
  },

  HOUR_2: {
    name: "2 Hours",
    tickWidth: 40,
    step: 2, // 2小时
    unit: "hour",
    dayStartHour: 6, // 一天开始时间（早上6点），结束时间为第二天早上6点
    upperFormat: (date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${month}-${day}`;
    },
    lowerFormat: (date) => {
      return date.getHours();
    },
  },

  HOUR_6: {
    name: "6 Hours",
    tickWidth: 60,
    step: 6, // 6小时
    unit: "hour",
    dayStartHour: 6, // 一天开始时间（早上6点），结束时间为第二天早上6点
    upperFormat: (date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${month}-${day}`;
    },
    lowerFormat: (date) => {
      return date.getHours();
    },
  },

  DAY: {
    name: "Day",
    tickWidth: 120,
    step: 1, // 天
    unit: "day",
    dayStartHour: 6, // 一天开始时间（早上6点）- 影响时间轴起始点和任务定位
    // 上层显示月份，下层显示日期
    upperFormat: (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}`;
    },
    lowerFormat: (date) => {
      return date.getDate();
    },
  },

  // WEEK: {
  //   name: "Week",
  //   tickWidth: 80,
  //   step: 7, // 7天
  //   unit: "day",
  //   dayStartHour: 6, // 一天开始时间（早上6点）- 影响时间轴起始点和任务定位
  //   upperFormat: (date) => {
  //     const year = date.getFullYear();
  //     const month = String(date.getMonth() + 1).padStart(2, "0");
  //     return `${year}-${month}`;
  //   },
  //   lowerFormat: (date) => {
  //     const weekNum = Math.ceil(date.getDate() / 7);
  //     return `W${weekNum}`;
  //   },
  // },

  // MONTH: {
  //   name: "Month",
  //   tickWidth: 200,
  //   step: 1, // 月
  //   unit: "month",
  //   dayStartHour: 6, // 一天开始时间（早上6点）- 影响时间轴起始点和任务定位
  //   // 上层显示年份，下层显示月份
  //   upperFormat: (date) => {
  //     return String(date.getFullYear());
  //   },
  //   lowerFormat: (date) => {
  //     const months = [
  //       "Jan",
  //       "Feb",
  //       "Mar",
  //       "Apr",
  //       "May",
  //       "Jun",
  //       "Jul",
  //       "Aug",
  //       "Sep",
  //       "Oct",
  //       "Nov",
  //       "Dec",
  //     ];
  //     return months[date.getMonth()];
  //   },
  // },
};

/**
 * 甘特图默认配置
 */
export const DEFAULT_OPTIONS = {
  // 视图模式 - 可选值: 'HOUR', 'HOUR_2', 'DAY', 'WEEK', 'MONTH'
  view_mode: "DAY",

  // 是否显示视图模式选择器
  view_mode_select: true,

  // 可用的视图模式列表
  view_modes: DEFAULT_VIEW_MODES,

  // 是否显示当前时间线
  show_current_time: false,

  // 资源行高度（像素）- 控制每个资源行的高度
  rowHeight: 60,

  // 时间轴起始天数偏移 - 相对今天的天数（负数表示过去）
  startDay: -7,

  // 时间轴结束天数偏移 - 相对今天的天数（正数表示未来）
  endDay: 7,

  // 任务条垂直内边距（像素）- 任务条与行边界的上下间距
  barPaddingY: 5,

  // 是否显示「今天」快捷按钮
  today_button: true,

  // 容器高度。'auto' 表示随内容自展开，也可以设置为任意正整数（单位px）
  container_height: "auto",

  // 左侧资源列宽度（像素）
  resource_col_width: 80,

  // 任务点击回调 - 传入函数则覆盖内置弹窗，参数为 (task, event)
  on_task_click: null,
};
