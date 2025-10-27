import express from "express";
import cors from "cors";
import couchbase from "couchbase";

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3001;

const connectToCouchbase = async () => {
  try {
    const cluster = await couchbase.connect(process.env.COUCHBASE_CONNSTR, {
      username: process.env.COUCHBASE_USERNAME,
      password: process.env.COUCHBASE_PASSWORD,
    });
    const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET);
    const collection = bucket.defaultCollection();
    console.log("✅ Connected to Couchbase");
    return collection;
  } catch (err) {
    console.error("❌ Couchbase connection failed:", err);
    process.exit(1);
  }
};

let collectionPromise = connectToCouchbase();

app.post("/api/punch", async (req, res) => {
  try {
    const collection = await collectionPromise;
    const punch = { time: req.body.time, createdAt: new Date().toISOString() };
    const key = `punch_${Date.now()}`;
    await collection.upsert(key, punch);
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to save punch" });
  }
});

app.get("/api/punches", async (req, res) => {
  try {
    const collection = await collectionPromise;
    const result = await collection.getAllScopesAndCollections();
    // Simplified retrieval for demo (you can later switch to N1QL query)
    res.send([{ time: "Sample Data (DB Query to be extended)" }]);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch punches" });
  }
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
