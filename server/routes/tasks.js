"use strict";
const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/tasks  查询所有任务
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        ID          AS "id",
        DISPLAY     AS "display",
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
    res.json(rows);
  } catch (err) {
    console.error("tasks GET error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks  新增任务
// body: { display, product, machine, type, startDate, duration, qty, tt, jobchange }
router.post("/", async (req, res) => {
  const {
    display,
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
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const id = String(Date.now());
    const sql = `
      INSERT INTO FR_CX_SCHEDULE_TASK
        (ID, DISPLAY, PRODUCT, MACHINE, TYPE, START_DATE, DURATION, QTY, TT, JOBCHANGE)
      VALUES
        (:id, :display, :product, :machine, :type,
         TO_TIMESTAMP(:startDate, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
         :duration, :qty, :tt, :jobchange)
    `;
    await db.query(sql, {
      id,
      display,
      product,
      machine,
      type: String(type),
      startDate: new Date(startDate).toISOString().slice(0, 23) + "Z",
      duration,
      qty,
      tt,
      jobchange,
    });
    res.status(201).json({ id });
  } catch (err) {
    console.error("tasks POST error:", err);
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

    if (body.display !== undefined) {
      setClauses.push("DISPLAY    = :display");
      binds.display = body.display;
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
      setClauses.push(
        'START_DATE = TO_TIMESTAMP(:startDate, \'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"\')',
      );
      binds.startDate =
        new Date(body.startDate).toISOString().slice(0, 23) + "Z";
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
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("tasks PUT error:", err);
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
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("tasks DELETE error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
