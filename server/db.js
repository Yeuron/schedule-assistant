"use strict";
require("dotenv").config();
const oracledb = require("oracledb");

// 切换到 Thick 模式，支持旧版 Oracle 密码验证算法（0x939）
// 需要安装 Oracle Instant Client，并设置 .env 中的 ORACLE_CLIENT_LIB_DIR
// 若已配置 PATH 或 LD_LIBRARY_PATH 可留空，oracledb 会自动搜索
try {
  oracledb.initOracleClient({
    libDir: process.env.ORACLE_CLIENT_LIB_DIR || undefined,
  });
  console.log("oracledb: Thick mode enabled");
} catch (err) {
  console.error("oracledb Thick mode init failed:", err.message);
  process.exit(1);
}

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE}`,
};

let pool;

async function init() {
  pool = await oracledb.createPool({
    ...dbConfig,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
  });
  console.log("Oracle connection pool created");
}

async function query(sql, binds = [], opts = {}) {
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(sql, binds, {
      autoCommit: true,
      ...opts,
    });
    return result;
  } finally {
    await conn.close();
  }
}

async function close() {
  if (pool) await pool.close();
}

module.exports = { init, query, close };
