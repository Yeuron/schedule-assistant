# Schedule Assistant 部署指南

## 前置要求

- Node.js 18+
- npm 8+
- PM2（全局安装）：`npm install -g pm2`
- Oracle Instant Client（Thick 模式必须，与 DB 版本匹配）

## 快速开始

### 步骤 1：配置环境变量

复制并编辑 .env 文件：
```
cp server/.env.example server/.env
# 编辑 server/.env，填写数据库连接信息
```

### 步骤 2：启动服务

**Windows：**
```
start.bat
```

**Linux/Mac：**
```bash
chmod +x start.sh stop.sh
./start.sh
```

访问 http://localhost:3000

## PM2 常用命令

```bash
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
```

## 配置文件说明

### server/.env
```
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=ORCL
DB_USER=your_user
DB_PASSWORD=your_password
ORACLE_CLIENT_LIB_DIR=/path/to/instantclient  # Windows 示例: C:\oracle\instantclient_21_13
PORT=3000
LOG_LEVEL=info
NODE_ENV=production
```

### ecosystem.config.js
PM2 进程配置，可按需修改 instances、env 等参数。

## 目录结构

```
schedule-assistant-2026-04-20/
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
├── start.bat / start.sh # 启动脚本
├── stop.bat  / stop.sh  # 停止脚本
└── .env.example  # 已在 server/ 目录下
```

## 日志

应用日志（Winston）保存在 `server/logs/`：
- `combined.log` — 全量日志
- `error.log` — 错误日志

PM2 日志（`~/.pm2/logs/`）：
```bash
pm2 logs schedule-assistant --lines 100
```
