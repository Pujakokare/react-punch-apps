// server/index.js
import express from "express";
import cors from "cors";
import couchbase from "couchbase";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 10000;

async function connectToCouchbase() {
  const connStr = process.env.COUCHBASE_CONNSTR;
  const username = process.env.COUCHBASE_USERNAME;
  const password = process.env.COUCHBASE_PASSWORD;
  const bucketName = process.env.COUCHBASE_BUCKET || "punches";

  if (!connStr || !username || !password) {
    console.error("Couchbase environment variables missing.");
    process.exit(1);
  }

  const cluster = await couchbase.connect(connStr, { username, password });
  const bucket = cluster.bucket(bucketName);
  const collection = bucket.defaultCollection();

  // ensure primary index for N1QL queries (no-op if exists)
  try {
    await cluster.queryIndexes().createPrimaryIndex(bucketName, { ignoreIfExists: true });
  } catch (err) {
    console.warn("Index create warning:", err);
  }

  return { cluster, bucket, collection };
}

const connPromise = connectToCouchbase();

// POST /api/punch-in
app.post("/api/punch-in", async (req, res) => {
  try {
    const { collection } = await connPromise;
    const time = req.body?.time || new Date().toISOString();
    const date = time.split("T")[0];
    const doc = {
      type: "punch",
      date,
      punchIn: time,
      punchOut: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const id = `punch::${Date.now()}::${uuidv4()}`;
    await collection.insert(id, doc);
    return res.json({ success: true, id, doc });
  } catch (err) {
    console.error("POST /api/punch-in error:", err);
    return res.status(500).json({ error: "Failed to create punch" });
  }
});

// POST /api/punch-out
app.post("/api/punch-out", async (req, res) => {
  try {
    const { cluster, collection } = await connPromise;
    const time = req.body?.time || new Date().toISOString();
    const bucketName = process.env.COUCHBASE_BUCKET;
    const query = `
      SELECT META(p).id AS id, p.*
      FROM \`${bucketName}\` p
      WHERE p.type = "punch" AND (p.punchOut IS MISSING OR p.punchOut IS NULL)
      ORDER BY p.createdAt DESC
      LIMIT 1
    `;
    const qres = await cluster.query(query);
    if (!qres.rows || qres.rows.length === 0) {
      return res.status(404).json({ error: "No open punch found to punch out" });
    }
    const row = qres.rows[0];
    const id = row.id;
    const doc = row;
    doc.punchOut = time;
    doc.updatedAt = new Date().toISOString();
    await collection.replace(id, doc);
    return res.json({ success: true, id, doc });
  } catch (err) {
    console.error("POST /api/punch-out error:", err);
    return res.status(500).json({ error: "Failed to punch out" });
  }
});

// GET /api/punches
app.get("/api/punches", async (req, res) => {
  try {
    const { cluster } = await connPromise;
    const bucketName = process.env.COUCHBASE_BUCKET;
    const query = `
      SELECT META(p).id AS id, p.date, p.punchIn, p.punchOut, p.createdAt, p.updatedAt
      FROM \`${bucketName}\` p
      WHERE p.type = "punch"
      ORDER BY p.createdAt DESC
      LIMIT 200
    `;
    const qres = await cluster.query(query);
    const normalized = qres.rows.map((r) => ({
      id: r.id,
      date: r.date,
      punchIn: r.punchIn,
      punchOut: r.punchOut || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
    res.json(normalized);
  } catch (err) {
    console.error("GET /api/punches error:", err);
    res.status(500).json({ error: "Failed to fetch punches" });
  }
});

// Serve React build
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));



































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
