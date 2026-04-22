"use strict";
const express = require("express");
const db = require("../db");
const logger = require("../logger");
const {
  formatDateForDb,
  isAlignedToHalfHour,
  alignToHalfHour,
} = require("../dateUtils");

const router = express.Router();

// GET /api/tasks  查询所有任务
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        ID          AS "id",
        DISPLAY     AS "remark",
        PRODUCT     AS "product",
        MACHINE     AS "machine",
        TYPE        AS "type",
        START_DATE  AS "startDate",
        DURATION    AS "duration",
        QTY         AS "qty",
        TT          AS "tt",
        JOBCHANGE   AS "jobchange"
      FROM FR_CX_SCHEDULE_TASK
      ORDER BY START_DATE, MACHINE
    `;
    const result = await db.query(sql);
    // Oracle DATE -> JS Date，直接传给前端（ISO字符串），前端用 new Date() 转换
    const rows = result.rows.map((row) => ({
      ...row,
      type: String(row.type),
    }));
    logger.info(`Tasks fetched successfully | Count: ${rows.length}`);
    res.json(rows);
  } catch (err) {
    logger.error(`Failed to fetch tasks: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks  新增任务
// body: { display, product, machine, type, startDate, duration, qty, tt, jobchange }
router.post("/", async (req, res) => {
  const {
    remark,
    product,
    machine,
    type,
    startDate,
    duration,
    qty,
    tt,
    jobchange,
  } = req.body;

  if (!product || !machine || !type || !startDate || !qty) {
    logger.warn(
      `Task creation failed - Missing required fields | Product: ${product}, Machine: ${machine}, Type: ${type}`,
    );
    return res.status(400).json({ error: "Missing required fields" });
  }
  const display = remark || "";

  try {
    const id = String(Date.now());

    // 时间对齐校验：确保开始时间对齐到30分钟
    const startDateObj = new Date(startDate);
    if (!isAlignedToHalfHour(startDateObj)) {
      const aligned = alignToHalfHour(startDateObj);
      logger.warn(
        `Task creation: startDate not aligned to half-hour, auto-aligned | Original: ${formatDateForDb(startDateObj)} → Aligned: ${formatDateForDb(aligned)}`,
      );
    }

    const sql = `
      INSERT INTO FR_CX_SCHEDULE_TASK
        (ID, DISPLAY, PRODUCT, MACHINE, TYPE, START_DATE, DURATION, QTY, TT, JOBCHANGE)
      VALUES
        (:id, :display, :product, :machine, :type,
         TO_DATE(:startDate, 'YYYY-MM-DD HH24:MI:SS'),
         :duration, :qty, :tt, :jobchange)
    `;
    await db.query(sql, {
      id,
      display,
      product,
      machine,
      type: String(type),
      startDate: formatDateForDb(startDate),
      duration,
      qty,
      tt,
      jobchange,
    });
    logger.info(
      `Task created successfully | ID: ${id} | Product: ${product}, Machine: ${machine}, Type: ${type} | StartDate: ${formatDateForDb(startDate)}`,
    );
    res.status(201).json({ id });
  } catch (err) {
    logger.error(`Failed to create task: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id  更新任务
router.put("/:id", async (req, res) => {
  const id = String(req.params.id);
  const body = req.body;

  try {
    // 只更新 body 中实际传入的字段
    const setClauses = [];
    const binds = { id };

    if (body.remark !== undefined) {
      setClauses.push("DISPLAY    = :display");
      binds.display = body.remark;
    }
    if (body.product !== undefined) {
      setClauses.push("PRODUCT    = :product");
      binds.product = body.product;
    }
    if (body.machine !== undefined) {
      setClauses.push("MACHINE    = :machine");
      binds.machine = body.machine;
    }
    if (body.type !== undefined) {
      setClauses.push("TYPE       = :type");
      binds.type = String(body.type);
    }
    if (body.startDate !== undefined) {
      // 时间对齐校验：确保开始时间对齐到30分钟
      const startDateObj = new Date(body.startDate);
      if (!isAlignedToHalfHour(startDateObj)) {
        const aligned = alignToHalfHour(startDateObj);
        logger.warn(
          `Task update: startDate not aligned to half-hour, auto-aligned | Original: ${formatDateForDb(startDateObj)} → Aligned: ${formatDateForDb(aligned)}`,
        );
      }

      setClauses.push(
        "START_DATE = TO_DATE(:startDate, 'YYYY-MM-DD HH24:MI:SS')",
      );
      binds.startDate = formatDateForDb(body.startDate);
    }
    if (body.duration !== undefined) {
      setClauses.push("DURATION   = :duration");
      binds.duration = body.duration;
    }
    if (body.qty !== undefined) {
      setClauses.push("QTY        = :qty");
      binds.qty = body.qty;
    }
    if (body.tt !== undefined) {
      setClauses.push("TT         = :tt");
      binds.tt = body.tt;
    }
    if (body.jobchange !== undefined) {
      setClauses.push("JOBCHANGE  = :jobchange");
      binds.jobchange = body.jobchange;
    }

    setClauses.push("UPDATE_TIME = SYSDATE");

    const sql = `UPDATE FR_CX_SCHEDULE_TASK SET ${setClauses.join(", ")} WHERE ID = :id`;
    const result = await db.query(sql, binds);
    if (result.rowsAffected === 0) {
      logger.warn(`Task update failed - Task not found | ID: ${id}`);
      return res.status(404).json({ error: "Task not found" });
    }
    logger.info(
      `Task updated successfully | ID: ${id} | Fields: ${Object.keys(body).join(", ")}`,
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error(`Failed to update task ${id}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id  删除任务
router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);
  try {
    const result = await db.query(
      "DELETE FROM FR_CX_SCHEDULE_TASK WHERE ID = :id",
      { id },
    );
    if (result.rowsAffected === 0) {
      logger.warn(`Task deletion failed - Task not found | ID: ${id}`);
      return res.status(404).json({ error: "Task not found" });
    }
    logger.info(`Task deleted successfully | ID: ${id}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error(`Failed to delete task ${id}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
