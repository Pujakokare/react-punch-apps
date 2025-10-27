const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve React build for Render
const clientBuildPath = path.join(__dirname, "../client/build");
app.use(express.static(clientBuildPath));

// ✅ Temporary in-memory punches
let punches = [];

// ✅ Health check route
app.get("/healthcheck", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ Save punch
app.post("/api/punch", (req, res) => {
  try {
    //const { punchTime } = req.body;
    const punchTime = req.body.punchTime || req.body.time;
    const note = req.body.note || "";

    // Validate input
    if (!punchTime) {
      return res.status(400).json({ error: "punchTime is required" });
    }

    const id = `punch_${Date.now()}`;
    //const punch = { id, punchTime };
    const punch = { id, time: punchTime, note, createdAt: new Date().toISOString() };
    punches.push(punch);

    console.log("✅ Punch saved:", punch);
    //res.json({ success: true, id });
    res.json({ success: true, punch });
  } catch (err) {
    console.error("❌ Error saving punch:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Get all punches
app.get("/api/punches", (req, res) => {
  res.json(punches);
});

// ✅ Catch-all route for React
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});














// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// // const couchbase = require("couchbase"); // disabled for now

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Serve React build (for Render)
// app.use(express.static(path.join(__dirname, "../client/build")));

// // Simulated data store (until Couchbase cloud setup)
// const punches = [];

// // Routes
// app.get("/healthcheck", (req, res) => {
//   res.json({ status: "ok" });
// });

// app.post("/punch", async (req, res) => {
//   try {
//     const { punchTime } = req.body;
//     const id = `punch_${Date.now()}`;
//     punches.push({ id, punchTime });
//     res.json({ success: true, id });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get("/punches", async (req, res) => {
//   try {
//     res.json(punches);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // React frontend catch-all
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/build", "index.html"));
// });

// // Start server







// // server/index.js
// import express from "express";
// import cors from "cors";
// import couchbase from "couchbase";
// import path from "path";
// import { fileURLToPath } from "url";
// import { v4 as uuidv4 } from "uuid";


// const express = require('express');
// const cors = require('cors');
// const couchbase = require('couchbase');

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Environment variables (set on Render)
// const COUCHBASE_CONNSTR = process.env.COUCHBASE_CONNSTR;
// const COUCHBASE_USER = process.env.COUCHBASE_USER;
// const COUCHBASE_PASSWORD = process.env.COUCHBASE_PASSWORD;
// const COUCHBASE_BUCKET = process.env.COUCHBASE_BUCKET || 'punches';
// const PORT = process.env.SERVER_PORT || 4000;

// if (!COUCHBASE_CONNSTR || !COUCHBASE_USER || !COUCHBASE_PASSWORD) {
//   console.error('Missing Couchbase environment variables. Set COUCHBASE_CONNSTR, COUCHBASE_USER, COUCHBASE_PASSWORD.');
//   // do not exit to allow Render to show logs; but endpoints will fail until vars present
// }

// let cluster, bucket, collection;

// // Async IIFE to connect to Couchbase
// (async () => {
//   try {
//     cluster = await couchbase.connect(COUCHBASE_CONNSTR, {
//       username: COUCHBASE_USER,
//       password: COUCHBASE_PASSWORD
//     });
//     bucket = cluster.bucket(COUCHBASE_BUCKET);
//     collection = bucket.defaultCollection();

//     // Create primary index if not exists (needed for N1QL queries)
//     try {
//       const query = `CREATE PRIMARY INDEX IF NOT EXISTS ON \`${COUCHBASE_BUCKET}\``;
//       await cluster.query(query);
//       console.log('Ensured primary index exists on bucket', COUCHBASE_BUCKET);
//     } catch (err) {
//       console.warn('Primary index creation failed or not necessary:', err.message);
//     }

//     console.log('Connected to Couchbase bucket:', COUCHBASE_BUCKET);
//   } catch (err) {
//     console.error('Couchbase connection error:', err);
//   }
// })();

// // Utility to generate document ID
// function generateId() {
//   return `punch::${Date.now()}::${Math.random().toString(36).substr(2, 6)}`;
// }

// // POST /api/punch
// // Body: { time: ISOString, note?: string }
// app.post('/api/punch', async (req, res) => {
//   const { time, note } = req.body;
//   if (!time) return res.status(400).json({ error: 'Missing time field' });

//   const id = generateId();
//   const doc = {
//     type: 'punch',
//     time,            // ISO string of the punch time (user provided or client local)
//     note: note || null,
//     createdAt: new Date().toISOString()
//   };

//   try {
//     await collection.insert(id, doc);
//     return res.status(201).json({ id, doc });
//   } catch (err) {
//     console.error('Insert error:', err);
//     return res.status(500).json({ error: 'Failed to store punch' });
//   }
// });

// // GET /api/punches
// // Returns latest 100 punches ordered by time descending
// app.get('/api/punches', async (req, res) => {
//   try {
//     const q = `
//       SELECT meta().id, p.*
//       FROM \`${COUCHBASE_BUCKET}\` p
//       WHERE p.type = "punch"
//       ORDER BY p.time DESC
//       LIMIT 100
//     `;
//     const result = await cluster.query(q);
//     const rows = result.rows.map(r => {
//       // meta().id is included as `id` field
//       return r;
//     });
//     return res.json(rows);
//   } catch (err) {
//     console.error('Query error:', err);
//     return res.status(500).json({ error: 'Failed to fetch punches' });
//   }
// });

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok' });
// });

// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });







// // server/index.js
// import express from "express";
// import cors from "cors";
// import couchbase from "couchbase";
// import path from "path";
// import { fileURLToPath } from "url";
// import { v4 as uuidv4 } from "uuid";

// const app = express();
// app.use(express.json());
// app.use(cors());

// const port = process.env.PORT || 10000;

// async function connectToCouchbase() {
//   const connStr = process.env.COUCHBASE_CONNSTR;
//   const username = process.env.COUCHBASE_USERNAME;
//   const password = process.env.COUCHBASE_PASSWORD;
//   const bucketName = process.env.COUCHBASE_BUCKET || "punches";

//   if (!connStr || !username || !password) {
//     console.error("Couchbase environment variables missing.");
//     process.exit(1);
//   }

//   const cluster = await couchbase.connect(connStr, { username, password });
//   const bucket = cluster.bucket(bucketName);
//   const collection = bucket.defaultCollection();

//   // ensure primary index for N1QL queries (no-op if exists)
//   try {
//     await cluster.queryIndexes().createPrimaryIndex(bucketName, { ignoreIfExists: true });
//   } catch (err) {
//     console.warn("Index create warning:", err);
//   }

//   return { cluster, bucket, collection };
// }

// const connPromise = connectToCouchbase();

// // POST /api/punch-in
// app.post("/api/punch-in", async (req, res) => {
//   try {
//     const { collection } = await connPromise;
//     const time = req.body?.time || new Date().toISOString();
//     const date = time.split("T")[0];
//     const doc = {
//       type: "punch",
//       date,
//       punchIn: time,
//       punchOut: null,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };
//     const id = `punch::${Date.now()}::${uuidv4()}`;
//     await collection.insert(id, doc);
//     return res.json({ success: true, id, doc });
//   } catch (err) {
//     console.error("POST /api/punch-in error:", err);
//     return res.status(500).json({ error: "Failed to create punch" });
//   }
// });

// // POST /api/punch-out
// app.post("/api/punch-out", async (req, res) => {
//   try {
//     const { cluster, collection } = await connPromise;
//     const time = req.body?.time || new Date().toISOString();
//     const bucketName = process.env.COUCHBASE_BUCKET;
//     const query = `
//       SELECT META(p).id AS id, p.*
//       FROM \`${bucketName}\` p
//       WHERE p.type = "punch" AND (p.punchOut IS MISSING OR p.punchOut IS NULL)
//       ORDER BY p.createdAt DESC
//       LIMIT 1
//     `;
//     const qres = await cluster.query(query);
//     if (!qres.rows || qres.rows.length === 0) {
//       return res.status(404).json({ error: "No open punch found to punch out" });
//     }
//     const row = qres.rows[0];
//     const id = row.id;
//     const doc = row;
//     doc.punchOut = time;
//     doc.updatedAt = new Date().toISOString();
//     await collection.replace(id, doc);
//     return res.json({ success: true, id, doc });
//   } catch (err) {
//     console.error("POST /api/punch-out error:", err);
//     return res.status(500).json({ error: "Failed to punch out" });
//   }
// });

// // GET /api/punches
// app.get("/api/punches", async (req, res) => {
//   try {
//     const { cluster } = await connPromise;
//     const bucketName = process.env.COUCHBASE_BUCKET;
//     const query = `
//       SELECT META(p).id AS id, p.date, p.punchIn, p.punchOut, p.createdAt, p.updatedAt
//       FROM \`${bucketName}\` p
//       WHERE p.type = "punch"
//       ORDER BY p.createdAt DESC
//       LIMIT 200
//     `;
//     const qres = await cluster.query(query);
//     const normalized = qres.rows.map((r) => ({
//       id: r.id,
//       date: r.date,
//       punchIn: r.punchIn,
//       punchOut: r.punchOut || null,
//       createdAt: r.createdAt,
//       updatedAt: r.updatedAt,
//     }));
//     res.json(normalized);
//   } catch (err) {
//     console.error("GET /api/punches error:", err);
//     res.status(500).json({ error: "Failed to fetch punches" });
//   }
// });

// // Serve React build
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, "../client/build")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/build/index.html"));
// });

// app.listen(port, () => console.log(`🚀 Server running on port ${port}`));


// NEW *********************************

// import express from "express";
// import cors from "cors";
// import couchbase from "couchbase";
// import path from "path";
// import { fileURLToPath } from "url";

// const app = express();
// app.use(express.json());
// app.use(cors());

// const port = process.env.PORT || 3001;

// // ✅ Couchbase Connection
// const connectToCouchbase = async () => {
//   try {
//     const cluster = await couchbase.connect(process.env.COUCHBASE_CONNSTR, {
//       username: process.env.COUCHBASE_USERNAME,
//       password: process.env.COUCHBASE_PASSWORD,
//     });
//     const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
//     const collection = bucket.defaultCollection();
//     console.log("✅ Connected to Couchbase");
//     return { cluster, collection };
//   } catch (err) {
//     console.error("❌ Couchbase connection failed:", err);
//     process.exit(1);
//   }
// };

// let connectionPromise = connectToCouchbase();

// // ✅ Punch In (Save Time)
// app.post("/api/punch", async (req, res) => {
//   try {
//     const { collection } = await connectionPromise;
//     const punch = { time: req.body.time, createdAt: new Date().toISOString() };
//     const key = `punch_${Date.now()}`;
//     await collection.upsert(key, punch);
//     res.send({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ error: "Failed to save punch" });
//   }
// });

// // ✅ Fetch Last 10 Punches (Fixed)
// app.get("/api/punches", async (req, res) => {
//   try {
//     const { cluster } = await connectionPromise;
//     const query = `SELECT time FROM \`${process.env.COUCHBASE_BUCKET}\` ORDER BY createdAt DESC LIMIT 10`;
//     const result = await cluster.query(query);
//     res.send(result.rows);
//   } catch (err) {
//     console.error("❌ Error fetching punches:", err);
//     res.status(500).send({ error: "Failed to fetch punches" });
//   }
// });

// // ✅ Serve React Frontend
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.use(express.static(path.join(__dirname, "../client/build")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/build/index.html"));
// });

// // ✅ Start Server
// app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
