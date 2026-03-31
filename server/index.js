"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const productMasterRouter = require("./routes/productMaster");
const tasksRouter = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/product-master", productMasterRouter);
app.use("/api/tasks", tasksRouter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

async function start() {
  await db.init();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

process.on("SIGINT", async () => {
  await db.close();
  process.exit(0);
});

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
