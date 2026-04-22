"use strict";
const winston = require("winston");
const path = require("path");

// 创建 logs 目录
const logsDir = path.join(__dirname, "logs");
const fs = require("fs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const msg = stack ? `${message}\n${stack}` : message;
    return `[${timestamp}] [${level.toUpperCase()}] ${msg}`;
  }),
);

// 创建 logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "schedule-assistant" },
  transports: [
    // 错误日志：只记录 error 及以上级别
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    // 全量日志：记录所有级别
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// 开发环境同时输出到控制台
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          const msg = stack ? `${message}\n${stack}` : message;
          return `[${timestamp}] [${level}] ${msg}`;
        }),
      ),
    }),
  );
}

module.exports = logger;
