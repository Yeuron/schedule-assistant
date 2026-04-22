# Schedule Assistant 一键打包指南

## 简介

本项目提供了一键打包脚本，可以自动：
1. 构建前端 Vue3 应用
2. 合并前后端文件
3. 生成可直接发布的压缩包（.zip）

## 前置要求

- Node.js 14+
- npm 6+
- Git（如果从仓库克隆）

## 快速开始

### 1. 安装依赖

在项目根目录执行：

```bash
npm install
```

### 2. 执行打包

```bash
npm run build
```

或直接执行：

```bash
node build.js
```

### 3. 查看打包结果

打包完成后，在 `build/` 目录下会生成：

```
build/
├── schedule-assistant-2026-04-16/
│   ├── server/
│   │   ├── public/                    # 前端构建文件（自动生成）
│   │   ├── routes/
│   │   ├── logs/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── logger.js
│   │   ├── package.json
│   │   └── ...
│   ├── start.bat                      # Windows 启动脚本
│   ├── start.sh                       # Linux/Mac 启动脚本
│   ├── DEPLOY.md                      # 部署指南
│   ├── .env.example
│   └── package.json
└── schedule-assistant-2026-04-16.zip  # ← 最终发布包
```

## 部署

### 方法 1：解压后启动

#### Windows

1. 解压 `schedule-assistant-YYYY-MM-DD.zip`
2. 进入解压后的目录
3. 编辑 `server/.env` 配置数据库连接
4. 双击 `start.bat`

#### Linux/Mac

1. 解压压缩包
   ```bash
   unzip schedule-assistant-YYYY-MM-DD.zip
   cd schedule-assistant-YYYY-MM-DD
   ```

2. 编辑数据库配置
   ```bash
   cp .env.example server/.env
   vim server/.env  # 修改数据库连接信息
   ```

3. 启动应用
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

### 方法 2：手动启动

```bash
cd schedule-assistant-YYYY-MM-DD/server
npm install
node index.js
```

### 3. 访问应用

打开浏览器访问：http://localhost:3000

## 配置说明

### 环境变量 (.env)

在 `server/.env` 中配置：

```env
# Oracle 数据库
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=ORCL

# 应用配置
PORT=3000
LOG_LEVEL=info
NODE_ENV=production

# Oracle Instant Client (可选)
ORACLE_CLIENT_LIB_DIR=/path/to/oracle/client
```

参考 `.env.example` 了解所有可用配置项。

## 打包脚本功能详解

### build.js 做了什么

1. **清理** - 删除之前的构建文件
2. **安装依赖** - 在 `client/` 安装前端依赖
3. **构建前端** - 运行 `npm run build` 生成 `dist/`
4. **合并文件** - 将前端文件复制到 `server/public/`
5. **配置后端** - 生成静态文件服务配置
6. **创建包** - 生成 .zip 发布包

### 打包流程图

```
[源代码]
   ↓
[安装前端依赖]
   ↓
[Vite 构建前端]
   ↓
[复制前端到 server/public]
   ↓
[生成启动脚本]
   ↓
[创建 ZIP 压缩包]
   ↓
[✅ 完成 build/schedule-assistant-YYYY-MM-DD.zip]
```

## 文件说明

### 根目录新增文件

- **build.js** - 一键打包脚本
- **package.json** - 根项目配置（用于管理打包依赖）

### server/ 目录变更

- **public/** - 新增，包含前端构建文件（由打包脚本自动生成）
- **public-serve.js** - 新增，生产环境静态文件服务配置（由打包脚本自动生成）
- **index.js** - 已更新，支持静态文件服务和 SPA 路由

## 常见问题

### Q: 打包失败，显示"npm: not found"

**A:** 确保已安装 Node.js 和 npm，并将其加入系统 PATH。

```bash
node --version
npm --version
```

### Q: 打包时间很长

**A:** 首次打包会下载所有依赖，可能需要 5-10 分钟。后续打包会更快。

### Q: 解压后无法启动

**A:** 检查以下项目：
1. Node.js 版本是否 >= 14
2. `server/.env` 文件是否存在且配置正确
3. Oracle 数据库连接是否正常
4. 查看 `server/logs/error.log` 了解具体错误

### Q: 前端无法加载

**A:** 检查：
1. 后端是否正常运行
2. 浏览器是否能访问 http://localhost:3000
3. 浏览器控制台中是否有错误信息
4. 查看 `server/logs/combined.log` 中的 HTTP 请求日志

### Q: 如何修改端口

**A:** 编辑 `server/.env`：

```env
PORT=3001
```

然后重启服务。

## 开发过程中的打包

如果只想测试前端构建：

```bash
npm run client:build
```

构建后的文件在 `client/dist/`。

## 生产环境建议

1. **使用进程管理器** - PM2, Forever 等
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "schedule-assistant"
   ```

2. **配置反向代理** - Nginx, Apache 等

3. **启用日志轮转** - 已内置 Winston 日志轮转

4. **定期备份** - 备份数据库和日志

5. **监控应用** - 定期检查日志，监控性能

## 打包脚本自定义

### 修改压缩包名称

编辑 `build.js` 第 19 行：

```javascript
const PACKAGE_NAME = "schedule-assistant";  // 修改此项
```

### 修改忽略文件

编辑 `build.js` 第 80 行：

```javascript
copyDir(SERVER_DIR, path.join(appDir, "server"), [
  "node_modules",  // 忽略 node_modules
  "logs",          // 忽略 logs
  ".env",          // 忽略 .env
  // 添加更多要忽略的项
]);
```

### 修改静态资源缓存时间

在 `server/index.js` 中修改：

```javascript
app.use(express.static(publicDir, { maxAge: "1d" }));  // 改为需要的时间
```

## 支持

如有问题，请：
1. 查看 `server/logs/error.log` 错误日志
2. 查看 `server/logs/combined.log` 完整日志
3. 参考项目 README.md 和各模块文档

## 许可证

MIT
