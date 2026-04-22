#!/usr/bin/env node
/**
 * Schedule Assistant - 一键打包脚本
 * 功能：构建前端 + 合并后端 + 生成可发布的压缩包
 * 用法：node build.js
 */

"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const archiver = require("archiver");

const ROOT_DIR = __dirname;
const CLIENT_DIR = path.join(ROOT_DIR, "client");
const SERVER_DIR = path.join(ROOT_DIR, "server");
const DIST_DIR = path.join(CLIENT_DIR, "dist");
const PUBLIC_DIR = path.join(SERVER_DIR, "public");
const BUILD_DIR = path.join(ROOT_DIR, "build");
const PACKAGE_NAME = "schedule-assistant";
const TIMESTAMP = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

console.log("🚀 开始构建 Schedule Assistant...\n");

try {
  // ============ 步骤 1: 清理旧的构建文件 ============
  console.log("📦 步骤 1/4: 清理旧的构建文件...");
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  console.log("✓ 清理完成\n");

  // ============ 步骤 2: 构建前端 ============
  console.log("📦 步骤 2/4: 构建前端应用...");
  process.chdir(CLIENT_DIR);
  try {
    execSync("npm install", { stdio: "inherit" });
    console.log("✓ 前端依赖安装完成\n");
  } catch (err) {
    console.error("✗ 前端依赖安装失败", err.message);
    process.exit(1);
  }

  try {
    execSync("npm run build", { stdio: "inherit" });
    console.log("✓ 前端构建完成\n");
  } catch (err) {
    console.error("✗ 前端构建失败", err.message);
    process.exit(1);
  }

  // ============ 步骤 3: 复制前端到后端 public 目录 ============
  console.log("📦 步骤 3/4: 合并前端到后端...");
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error(`前端构建失败：${DIST_DIR} 不存在`);
  }

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  copyDir(DIST_DIR, PUBLIC_DIR);
  console.log(`✓ 前端文件已复制到 ${PUBLIC_DIR}\n`);

  // ============ 步骤 4: 打包 ============
  console.log("📦 步骤 4/4: 生成发布包...");
  process.chdir(ROOT_DIR);

  // 创建构建目录
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  // 创建应用目录
  const appName = `${PACKAGE_NAME}-${TIMESTAMP}`;
  const appDir = path.join(BUILD_DIR, appName);
  fs.mkdirSync(appDir, { recursive: true });

  // 复制服务器文件
  copyDir(SERVER_DIR, path.join(appDir, "server"), [
    "node_modules",
    "logs",
    ".env",
  ]);

  // 复制根目录文件
  const rootFiles = ["package.json", "README.md"];
  rootFiles.forEach((file) => {
    const src = path.join(ROOT_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(appDir, file));
    }
  });

  // 生成 PM2 ecosystem 配置文件
  const ecosystem = `module.exports = {
  apps: [
    {
      name: 'schedule-assistant',
      script: './server/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
`;
  fs.writeFileSync(path.join(appDir, "ecosystem.config.js"), ecosystem);

  // 创建 setup 脚本（首次部署，清空重装依赖）Windows
  fs.writeFileSync(
    path.join(appDir, "setup.bat"),
    `@echo off
echo [1/2] Installing server dependencies...
cd server
if exist node_modules rmdir /s /q node_modules
npm install --omit=dev
if errorlevel 1 (
  echo ERROR: npm install failed
  pause
  exit /b 1
)
cd ..
echo [2/2] Starting with PM2...
pm2 start ecosystem.config.js
pm2 save
echo Done. Visit http://localhost:3000
pause`,
  );

  // 创建 start 脚本（PM2 已有进程后续重启用）Windows
  fs.writeFileSync(
    path.join(appDir, "start.bat"),
    `@echo off
pm2 start ecosystem.config.js
pm2 save
echo Done. Visit http://localhost:3000
pause`,
  );

  // 创建 setup 脚本（首次部署）Linux/Mac
  const setupSh = `#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "[1/2] Installing server dependencies..."
rm -rf "$SCRIPT_DIR/server/node_modules"
cd "$SCRIPT_DIR/server"
npm install --omit=dev
cd "$SCRIPT_DIR"
echo "[2/2] Starting with PM2..."
pm2 start "$SCRIPT_DIR/ecosystem.config.js"
pm2 save
echo "Done. Visit http://localhost:3000"
`;
  fs.writeFileSync(path.join(appDir, "setup.sh"), setupSh);
  fs.chmodSync(path.join(appDir, "setup.sh"), 0o755);

  // 创建 start 脚本（后续重启用）Linux/Mac
  const startSh = `#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
pm2 start "$SCRIPT_DIR/ecosystem.config.js"
pm2 save
echo "Done. Visit http://localhost:3000"
`;
  fs.writeFileSync(path.join(appDir, "start.sh"), startSh);
  fs.chmodSync(path.join(appDir, "start.sh"), 0o755);

  // 创建停止脚本（Windows）
  fs.writeFileSync(
    path.join(appDir, "stop.bat"),
    `@echo off
pm2 stop schedule-assistant
echo Stopped.
pause`,
  );

  // 创建停止脚本（Linux/Mac）
  const stopSh = `#!/bin/bash
pm2 stop schedule-assistant
echo "Stopped."
`;
  fs.writeFileSync(path.join(appDir, "stop.sh"), stopSh);
  fs.chmodSync(path.join(appDir, "stop.sh"), 0o755);

  // 创建部署说明
  const deployGuide = `# Schedule Assistant 部署指南

## 前置要求

- Node.js 18+
- npm 8+
- PM2（全局安装）：\`npm install -g pm2\`
- Oracle Instant Client（Thick 模式必须，与 DB 版本匹配）

## 快速开始

### 步骤 1：配置环境变量

复制并编辑 .env 文件：
\`\`\`
cp server/.env.example server/.env
# 编辑 server/.env，填写数据库连接信息
\`\`\`

### 步骤 2：首次安装并启动

**Windows：**
\`\`\`
setup.bat
\`\`\`

**Linux/Mac：**
\`\`\`bash
chmod +x setup.sh start.sh stop.sh
./setup.sh
\`\`\`

> ⚠️ setup 只需运行一次。后续重启用 `start.bat` / `./start.sh`。

访问 http://localhost:3000

## PM2 常用命令

\`\`\`bash
# 查看运行状态
pm2 status

# 查看实时日志
pm2 logs schedule-assistant

# 重启
pm2 restart schedule-assistant

# 停止
pm2 stop schedule-assistant  # 或双击 stop.bat / ./stop.sh

# 开机自启（Linux）
pm2 startup
pm2 save
\`\`\`

## 配置文件说明

### server/.env
\`\`\`
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=ORCL
DB_USER=your_user
DB_PASSWORD=your_password
ORACLE_CLIENT_LIB_DIR=/path/to/instantclient  # Windows 示例: C:\\oracle\\instantclient_21_13
PORT=3000
LOG_LEVEL=info
NODE_ENV=production
\`\`\`

### ecosystem.config.js
PM2 进程配置，可按需修改 instances、env 等参数。

## 目录结构

\`\`\`
${appName}/
├── server/
│   ├── public/          # 前端构建文件
│   ├── logs/            # 应用日志
│   ├── routes/
│   ├── index.js
│   ├── db.js
│   ├── logger.js
│   ├── package.json
│   └── .env             # 需手动创建（参考 .env.example）
├── ecosystem.config.js  # PM2 配置
├── setup.bat / setup.sh # 首次安装+启动
├── start.bat / start.sh # 后续重启
└── stop.bat  / stop.sh  # 停止
\`\`\`

## 日志

应用日志（Winston）保存在 \`server/logs/\`：
- \`combined.log\` — 全量日志
- \`error.log\` — 错误日志

PM2 日志（\`~/.pm2/logs/\`）：
\`\`\`bash
pm2 logs schedule-assistant --lines 100
\`\`\`
`;

  fs.writeFileSync(path.join(appDir, "DEPLOY.md"), deployGuide);

  // 打包为 zip 文件
  const zipPath = path.join(BUILD_DIR, `${appName}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("error", (err) => {
    throw err;
  });

  output.on("close", () => {
    console.log(`✓ 发布包已生成: ${zipPath}`);
    console.log(
      `✓ 包大小: ${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)} MB\n`,
    );

    // 输出总结
    console.log("=" + "=".repeat(59));
    console.log("✅ 构建完成！");
    console.log("=" + "=".repeat(59));
    console.log(`\n📦 发布包位置: ${zipPath}`);
    console.log(`\n🚀 部署步骤:`);
    console.log(`  1. 解压文件: ${appName}.zip`);
    console.log(`  2. 编辑配置: server/.env （参考 server/.env.example）`);
    console.log(`  3. 首次启动: ./setup.sh  (安装依赖并启动，只需一次)`);
    console.log(`  4. 后续重启: ./start.sh`);
    console.log(`  5. 访问应用: http://localhost:3000`);
    console.log(`\n📋 PM2 常用命令:`);
    console.log(`     pm2 status                        # 查看状态`);
    console.log(`     pm2 logs schedule-assistant       # 查看日志`);
    console.log(`     pm2 restart schedule-assistant    # 重启`);
    console.log(`     pm2 stop schedule-assistant       # 停止\n`);
  });

  archive.pipe(output);
  archive.directory(appDir, appName);
  archive.finalize();
} catch (err) {
  console.error("\n❌ 构建失败:", err.message);
  console.error(err);
  process.exit(1);
}

/**
 * 递归复制目录
 * @param {string} src 源目录
 * @param {string} dest 目标目录
 * @param {Array<string>} ignore 要忽略的目录/文件
 */
function copyDir(src, dest, ignore = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src);

  for (const entry of entries) {
    if (ignore.includes(entry)) continue;

    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath, ignore);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
