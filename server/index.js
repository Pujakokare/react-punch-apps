import express from "express";
import cors from "cors";
import couchbase from "couchbase";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3001;

// ✅ Couchbase Connection
const connectToCouchbase = async () => {
  try {
    const cluster = await couchbase.connect(process.env.COUCHBASE_CONNSTR, {
      username: process.env.COUCHBASE_USERNAME,
      password: process.env.COUCHBASE_PASSWORD,
    });
    const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
    const collection = bucket.defaultCollection();
    console.log("✅ Connected to Couchbase");
    return { cluster, collection };
  } catch (err) {
    console.error("❌ Couchbase connection failed:", err);
    process.exit(1);
  }
};

let connectionPromise = connectToCouchbase();

// ✅ Punch In (Save Time)
app.post("/api/punch", async (req, res) => {
  try {
    const { collection } = await connectionPromise;
    const punch = { time: req.body.time, createdAt: new Date().toISOString() };
    const key = `punch_${Date.now()}`;
    await collection.upsert(key, punch);
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to save punch" });
  }
});

// ✅ Fetch Last 10 Punches (Fixed)
app.get("/api/punches", async (req, res) => {
  try {
    const { cluster } = await connectionPromise;
    const query = `SELECT time FROM \`${process.env.COUCHBASE_BUCKET}\` ORDER BY createdAt DESC LIMIT 10`;
    const result = await cluster.query(query);
    res.send(result.rows);
  } catch (err) {
    console.error("❌ Error fetching punches:", err);
    res.status(500).send({ error: "Failed to fetch punches" });
  }
});

// ✅ Serve React Frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
