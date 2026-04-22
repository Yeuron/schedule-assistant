# 日志系统文档

## 概览

服务器端已集成 Winston 日志框架，用于记录系统运行日志、数据库操作、API 请求和错误，便于量产后的监控和问题排查。

## 日志配置

### 日志文件位置

所有日志文件存储在 `server/logs/` 目录下：

- **error.log** - 仅记录 ERROR 级别日志（5MB 单文件上限，保留最近 10 个文件）
- **combined.log** - 记录所有级别日志（5MB 单文件上限，保留最近 10 个文件）

### 日志级别

```
error   - 错误
warn    - 警告
info    - 信息（默认）
debug   - 调试信息（开发环境）
```

### 环境控制

- **开发环境** (`NODE_ENV !== 'production'`)：日志同时输出到控制台和文件
- **生产环境** (`NODE_ENV = 'production'`)：日志仅输出到文件

### 日志格式

```
[2026-04-16 14:30:45] [INFO] Server running on http://localhost:3000 | Environment: development
```

包含的信息：
- 时间戳（YYYY-MM-DD HH:mm:ss）
- 日志级别
- 详细信息

## 日志记录详情

### 1. 应用启动/关闭 (index.js)

```
INFO: Server running on http://localhost:3000 | Environment: development
INFO: Health check requested
INFO: SIGINT received, shutting down gracefully...
INFO: Database connection closed
```

### 2. 数据库连接 (db.js)

```
INFO: oracledb: Thick mode enabled
INFO: Oracle connection pool created - poolMin:2, poolMax:10 | DB_SERVICE@HOST
INFO: Oracle connection pool closed
```

### 3. 数据库查询 (db.js)

**DML 操作（INSERT/UPDATE/DELETE）** - 必定记录：
```
INFO: SQL executed - Duration: 45ms | Rows affected: 1 | INSERT INTO FR_CX_SCHEDULE_TASK...
```

**慢查询** - 超过 1 秒记录：
```
WARN: Slow query detected - Duration: 1250ms | SELECT * FROM FR_CX_SCHEDULE_TASK...
```

**SQL 错误** - 自动捕获：
```
ERROR: SQL execution error - Duration: 120ms | Error: ORA-00904: invalid column name | UPDATE FR_CX_SCHEDULE_TASK...
```

### 4. HTTP 请求 (index.js 中间件)

所有 API 请求记录（自动）：

```
INFO: GET /api/tasks - Status: 200 - Duration: 45ms
INFO: POST /api/tasks - Status: 201 - Duration: 120ms
WARN: PUT /api/tasks/123 - Status: 404 - Duration: 20ms
ERROR: DELETE /api/tasks/invalid - Status: 500 - Duration: 85ms
```

### 5. 任务操作 (tasks.js)

**查询成功**：
```
INFO: Tasks fetched successfully | Count: 15
```

**创建成功**：
```
INFO: Task created successfully | ID: 1713267045000 | Product: C1, Machine: M1, Type: 1
```

**创建失败**：
```
WARN: Task creation failed - Missing required fields | Product: undefined, Machine: M1, Type: 1
```

**更新成功**：
```
INFO: Task updated successfully | ID: 1713267045000 | Fields: qty, duration
```

**更新失败（未找到）**：
```
WARN: Task update failed - Task not found | ID: 9999
```

**删除成功**：
```
INFO: Task deleted successfully | ID: 1713267045000
```

**删除失败（未找到）**：
```
WARN: Task deletion failed - Task not found | ID: 9999
```

**操作错误**：
```
ERROR: Failed to create task: ORA-01400: cannot insert NULL into ("FR_CX"."TASK"."PRODUCT")
```

### 6. 产品主数据操作 (productMaster.js)

**查询成功**：
```
INFO: Product master data fetched successfully | Count: 42
```

**查询错误**：
```
ERROR: Failed to fetch product master: ORA-00942: table or view does not exist
```

## 使用示例

### 查看实时日志（开发环境）

```bash
cd server
npm run dev
```

控制台输出示例：
```
[2026-04-16 14:30:45] [info] Server running on http://localhost:3000 | Environment: development
[2026-04-16 14:30:50] [info] GET /api/tasks - Status: 200 - Duration: 32ms
[2026-04-16 14:30:50] [info] Tasks fetched successfully | Count: 15
```

### 查看历史日志

```bash
# 查看所有日志
tail -f server/logs/combined.log

# 查看错误日志
tail -f server/logs/error.log

# 查看最近 100 行
tail -100 server/logs/combined.log

# 实时监控（Linux/Mac）
watch tail -20 server/logs/combined.log
```

### Windows 下查看日志

```bash
# 查看所有日志
type server\logs\combined.log

# 查看最后 50 行
powershell -Command "Get-Content server\logs\combined.log -Tail 50"

# 实时监控
Get-Content server\logs\combined.log -Wait
```

## 性能优化

1. **日志级别控制**：
   - 生产环境仅记录 `info` 及以上级别
   - 通过 `.env` 配置 `LOG_LEVEL` 调整

2. **慢查询检测**：
   - 自动检测超过 1 秒的 SQL 查询
   - 帮助识别性能问题

3. **日志文件轮转**：
   - 单文件 5MB 上限
   - 自动保留最近 10 个文件
   - 防止磁盘空间溢出

## 环境变量配置 (.env)

```
# 日志级别 (error, warn, info, debug)
LOG_LEVEL=info

# 运行环境
NODE_ENV=production  # 或 development
```

## 故障排查指南

### 1. 数据库连接失败

查看 error.log 中的 `oracledb Thick mode init failed` 或 `Failed to create connection pool` 错误。

### 2. 查询超时

查看 combined.log 中的 `Slow query detected` 警告，分析对应 SQL。

### 3. API 返回 5xx 错误

- 查看 error.log 了解具体错误信息
- 查看 combined.log 确认请求状态码和耗时
- 检查 SQL 错误日志

### 4. 内存泄漏

- 监控 combined.log 文件大小增长
- 确认日志轮转是否正常工作
- 检查是否存在未结束的数据库连接

## 最佳实践

1. **定期检查错误日志**：
   ```bash
   grep ERROR server/logs/error.log | head -20
   ```

2. **统计 API 调用频率**：
   ```bash
   grep "GET /api/tasks" server/logs/combined.log | wc -l
   ```

3. **找出耗时最长的操作**：
   ```bash
   grep "Duration:" server/logs/combined.log | sort -t: -k5 -rn | head -10
   ```

4. **监控特定时间段的日志**：
   ```bash
   grep "2026-04-16 14:" server/logs/combined.log
   ```

## 技术栈

- **日志框架**：Winston v3.19.0
- **传输方式**：File Transport
- **支持环境**：Node.js 14+

