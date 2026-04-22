"use strict";
const express = require("express");
const db = require("../db");
const logger = require("../logger");

const router = express.Router();

// GET /api/product-master
// 从 FR_CX_CL_INFO2 读取产品主数据，返回前端所需格式
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        CELL_NO       AS "product",
        DEVICE        AS "machine",
        TYPE          AS "type",
        PI            AS "pi",
        TT            AS "tt",
        OPERATION_RATE AS "utilization"
      FROM FR_CX_CL_INFO2
      ORDER BY CELL_NO, DEVICE, TYPE
    `;
    const result = await db.query(sql);
    // OPERATION_RATE 直接存储小数（如 0.97），无需转换
    const rows = result.rows.map((row) => ({
      ...row,
      type: String(row.type),
      utilization: row.utilization,
    }));
    logger.info(
      `Product master data fetched successfully | Count: ${rows.length}`,
    );
    res.json(rows);
  } catch (err) {
    logger.error(`Failed to fetch product master: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
