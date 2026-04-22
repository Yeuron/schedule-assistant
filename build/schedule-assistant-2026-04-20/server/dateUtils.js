"use strict";

/**
 * 时间处理工具函数
 * 统一处理前后端的时间转换问题，避免时区混乱
 */

/**
 * 将本地 Date 对象转换为数据库格式字符串（YYYY-MM-DD HH24:MI:SS）
 * @param {Date|string} date - Date 对象或 ISO 字符串
 * @returns {string} 格式为 "YYYY-MM-DD HH:MM:SS" 的本地时间字符串
 */
function formatDateForDb(date) {
  let d;
  if (typeof date === "string") {
    d = new Date(date);
  } else {
    d = date;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 验证时间字符串格式
 * @param {string} timeStr - 时间字符串
 * @returns {boolean} 是否有效
 */
function isValidDateString(timeStr) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timeStr);
}

/**
 * 检查时间是否对齐到30分钟边界
 * 有效时间：00:00, 00:30, 01:00, 01:30, ...
 * @param {Date|string} date - 时间
 * @returns {boolean} 是否对齐到30分钟
 */
function isAlignedToHalfHour(date) {
  let d;
  if (typeof date === "string") {
    d = new Date(date);
  } else {
    d = date;
  }
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const milliseconds = d.getMilliseconds();

  // 允许秒数和毫秒数有小偏差（由于时间转换）
  return (
    (minutes === 0 || minutes === 30) && seconds === 0 && milliseconds === 0
  );
}

/**
 * 将时间对齐到最近的30分钟边界（向上取整）
 * 2026-04-17 14:37:00 → 2026-04-17 15:00:00
 * @param {Date|string} date
 * @returns {Date} 对齐后的 Date
 */
function alignToHalfHour(date) {
  let d;
  if (typeof date === "string") {
    d = new Date(date);
  } else {
    d = date;
  }
  const ms = d.getTime();
  const alignedMs = Math.ceil(ms / 1800000) * 1800000;
  return new Date(alignedMs);
}

module.exports = {
  formatDateForDb,
  isValidDateString,
  isAlignedToHalfHour,
  alignToHalfHour,
};
