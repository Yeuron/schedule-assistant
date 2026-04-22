// 此文件由 build.js 自动生成，用于生产环境服务前端静态文件
module.exports = (app) => {
  const path = require("path");
  const publicDir = path.join(__dirname, "public");
  
  // 提供静态文件
  app.use(express.static(publicDir));
  
  // SPA 路由：所有非 /api 请求转发到 index.html
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(publicDir, "index.html"));
    }
  });
};
