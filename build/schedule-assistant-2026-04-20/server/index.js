"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./db");
const logger = require("./logger");
const productMasterRouter = require("./routes/productMaster");
const tasksRouter = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const level =
      statusCode >= 400 ? "warn" : statusCode >= 500 ? "error" : "info";

    logger[level](
      `${req.method} ${req.path} - Status: ${statusCode} - Duration: ${duration}ms`,
    );

    return originalSend.call(this, data);
  };

  next();
});

app.use("/api/product-master", productMasterRouter);
app.use("/api/tasks", tasksRouter);

app.get("/api/health", (req, res) => {
  logger.info("Health check requested");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===== 静态文件服务（生产环境）=====
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  // 提供静态资源文件
  app.use(express.static(publicDir, { maxAge: "1d" }));

  // SPA 路由：所有非 /api 请求转发到 index.html
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(publicDir, "index.html"));
    }
  });

  logger.info(`Static files serving from ${publicDir}`);
}

async function start() {
  try {
    await db.init();
    logger.info(`Database initialized successfully`);

    app.listen(PORT, () => {
      logger.info(
        `Server running on http://localhost:${PORT} | Environment: ${process.env.NODE_ENV || "development"}`,
      );
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  try {
    await db.close();
    logger.info("Database connection closed");
    process.exit(0);
  } catch (err) {
    logger.error(`Error during shutdown: ${err.message}`);
    process.exit(1);
  }
});

start().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
