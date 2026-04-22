"use strict";
require("dotenv").config();
const oracledb = require("oracledb");
const logger = require("./logger");

// Thick 模式：支持旧版 Oracle 密码验证算法（0x939）
try {
  oracledb.initOracleClient({
    libDir: process.env.ORACLE_CLIENT_LIB_DIR || undefined,
  });
  logger.info("oracledb: Thick mode enabled");
} catch (err) {
  logger.error(`oracledb Thick mode init failed: ${err.message}`);
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
  try {
    pool = await oracledb.createPool({
      ...dbConfig,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    });
    logger.info(
      `Oracle connection pool created - poolMin:2, poolMax:10 | ${process.env.DB_SERVICE}@${process.env.DB_HOST}`,
    );
  } catch (err) {
    logger.error(`Failed to create connection pool: ${err.message}`);
    throw err;
  }
}

async function query(sql, binds = [], opts = {}) {
  const conn = await pool.getConnection();
  const startTime = Date.now();
  try {
    const result = await conn.execute(sql, binds, {
      autoCommit: true,
      ...opts,
    });
    const duration = Date.now() - startTime;
    // 只记录修改类操作和长耗时查询
    if (
      sql.trim().toUpperCase().startsWith("INSERT") ||
      sql.trim().toUpperCase().startsWith("UPDATE") ||
      sql.trim().toUpperCase().startsWith("DELETE")
    ) {
      logger.info(
        `SQL executed - Duration: ${duration}ms | Rows affected: ${result.rowsAffected || 0} | ${sql.trim().substring(0, 80)}...`,
      );
    } else if (duration > 1000) {
      logger.warn(
        `Slow query detected - Duration: ${duration}ms | ${sql.trim().substring(0, 80)}...`,
      );
    }
    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error(
      `SQL execution error - Duration: ${duration}ms | Error: ${err.message} | ${sql.trim().substring(0, 80)}...`,
    );
    throw err;
  } finally {
    await conn.close();
  }
}

async function close() {
  if (pool) {
    try {
      await pool.close();
      logger.info("Oracle connection pool closed");
    } catch (err) {
      logger.error(`Error closing connection pool: ${err.message}`);
      throw err;
    }
  }
}

module.exports = { init, query, close };
