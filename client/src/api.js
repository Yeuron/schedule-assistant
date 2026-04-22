const BASE = "/api";

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/**
 * 将本地 Date 对象转换为数据库格式字符串（YYYY-MM-DD HH:MM:SS）
 * 采用本地时间，避免时区转换导致的时间混乱
 * @param {Date} date
 * @returns {string} "2026-04-17 08:30:00"
 */
function formatDateForDb(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 将时间对齐到最近的30分钟边界（向上取整）
 * 2026-04-17 14:37:00 → 2026-04-17 15:00:00
 * 2026-04-17 14:30:00 → 2026-04-17 14:30:00（已对齐）
 * @param {number|Date} time - 时间戳(ms) 或 Date 对象
 * @returns {number} 对齐后的时间戳(ms)
 */
function snapToHalfHour(time) {
  const ms = time instanceof Date ? time.getTime() : time;
  return Math.ceil(ms / 1800000) * 1800000; // 1800000 ms = 30 minutes
}

/**
 * 将时间对齐到最近的30分钟边界，返回 Date 对象
 * @param {number|Date} time - 时间戳(ms) 或 Date 对象
 * @returns {Date} 对齐后的 Date 对象
 */
function alignToHalfHour(time) {
  return new Date(snapToHalfHour(time));
}

export const api = {
  getProductMaster: () => request("GET", "/product-master"),
  getTasks: () => request("GET", "/tasks"),
  createTask: (task) =>
    request("POST", "/tasks", {
      ...task,
      startDate: formatDateForDb(task.startDate),
    }),
  updateTask: (id, change) =>
    request("PUT", `/tasks/${id}`, {
      ...change,
      startDate: change.startDate
        ? formatDateForDb(change.startDate)
        : undefined,
    }),
  deleteTask: (id) => request("DELETE", `/tasks/${id}`),
};

export const timeUtils = {
  snapToHalfHour,
  alignToHalfHour,
  formatDateForDb,
};
