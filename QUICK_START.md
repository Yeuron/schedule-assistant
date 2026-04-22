# 快速开始指南

## 一键打包

### Windows

在项目根目录打开命令行，执行：

```bash
npm run build
```

或

```bash
node build.js
```

### Linux/Mac

```bash
npm run build
```

## 打包完成

打包完成后，在 `build/` 目录找到：

```
build/
├── schedule-assistant-2026-04-16/      # 应用目录
└── schedule-assistant-2026-04-16.zip   # ← 发布包（直接上传）
```

## 发布部署

### 1. 上传文件

将 `schedule-assistant-YYYY-MM-DD.zip` 上传到生产服务器

### 2. 解压应用

#### Windows
```cmd
右键点击 → 解压全部
```

#### Linux/Mac
```bash
unzip schedule-assistant-2026-04-16.zip
cd schedule-assistant-2026-04-16
```

### 3. 配置数据库

编辑 `server/.env`（参考 `.env.example`）：

```env
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=your_host
DB_PORT=1521
DB_SERVICE=ORCL
PORT=3000
LOG_LEVEL=info
NODE_ENV=production
```

### 4. 启动应用

#### Windows
双击 `start.bat` 或：
```cmd
cd server
npm install
node index.js
```

#### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

### 5. 验证运行

打开浏览器访问：http://localhost:3000

## 文件说明

| 文件/目录 | 说明 |
|---------|------|
| `build.js` | 一键打包脚本 |
| `BUILD.md` | 详细打包文档 |
| `package.json` | 根项目配置（打包依赖） |
| `build/` | 打包输出目录 |
| `server/public/` | 前端构建文件（自动生成） |
| `server/logs/` | 运行日志目录 |

## 日志查看

启动后，实时查看日志：

```bash
# 所有日志
tail -f server/logs/combined.log

# 错误日志
tail -f server/logs/error.log
```

## 常用命令

```bash
# 前端开发
cd client
npm run dev

# 后端开发
cd server
npm run dev

# 同时运行前后端（需安装 concurrently）
npm run dev

# 只构建前端
npm run client:build

# 完整打包
npm run build

# 直接运行服务器
npm run server:start
```

## 架构

```
Schedule Assistant
├── client/              # 前端应用（Vue3 + Vite）
│   ├── src/
│   │   ├── components/
│   │   │   └── gantt/   # Gantt 图表组件
│   │   ├── App.vue
│   │   └── main.js
│   └── vite.config.js
│
├── server/              # 后端应用（Express + Oracle）
│   ├── public/          # 前端构建文件（生产环境）
│   ├── routes/          # API 路由
│   ├── index.js         # 应用入口
│   ├── db.js            # 数据库模块
│   ├── logger.js        # 日志模块
│   └── package.json
│
├── build.js             # 打包脚本
└── package.json         # 根项目配置
```

## 生产环境建议

1. **进程管理** - 使用 PM2
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "schedule-assistant"
   pm2 startup
   pm2 save
   ```

2. **反向代理** - 配置 Nginx
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       location / {
           proxy_pass http://localhost:3000;
       }
   }
   ```

3. **定期备份** - 数据库和日志

4. **监控告警** - 监控应用健康状态

## 故障排查

### 数据库连接失败
- 检查 `.env` 配置
- 确认数据库服务运行
- 查看 `server/logs/error.log`

### 前端无法加载
- 确认后端服务正常
- 检查浏览器控制台错误
- 查看 HTTP 请求日志

### 端口被占用
修改 `.env` 的 PORT 配置

### 性能问题
- 查看 `server/logs/combined.log` 中的慢查询
- 检查前端网络请求
- 监控数据库连接池

## 更多文档

- **详细打包文档**: [BUILD.md](BUILD.md)
- **日志系统文档**: [server/LOG_GUIDE.md](server/LOG_GUIDE.md)
- **项目说明**: [CLAUDE.md](CLAUDE.md)

