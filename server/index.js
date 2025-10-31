// server/index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectCouchbase, getCollection, getCluster } = require("./couchbase");
const { validateToken } = require("./authMiddleware");

const app = express();

// ✅ 1. CORS Configuration (Fixes your CORS policy issue)
const allowedOrigins = [
  "https://react-punch-app-1a2x.onrender.com", // your frontend Render URL
  "http://localhost:3000", // optional for local testing
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(cors()); // still use cors middleware
app.use(express.json());

// ✅ 2. Couchbase Connection
(async () => {
  try {
    await connectCouchbase();

    // ✅ 3. Punch-in API (Protected by Azure token)
    app.post("/api/punch", validateToken, async (req, res) => {
      try {
        const { time } = req.body;
        if (!time) return res.status(400).json({ error: "time required" });

        // Extract user email or ID from Azure AD token
        const user =
          req.user?.preferred_username ||
          req.user?.upn ||
          req.user?.email ||
          req.user?.oid ||
          req.user?.sub;

        const collection = getCollection();
        const doc = {
          type: "punch",
          time,
          createdAt: new Date().toISOString(),
          user,
        };
        const id = `punch::${Date.now()}::${Math.random()
          .toString(36)
          .slice(2)}`;

        await collection.insert(id, doc);
        res.status(201).json({ id, ...doc });
      } catch (err) {
        console.error("Punch save error:", err);
        res.status(500).json({ error: "Failed to save punch" });
      }
    });

    // ✅ 4. Fetch Punches API (open or protected as you prefer)
    app.get("/api/punches", async (req, res) => {
      try {
        const cluster = getCluster();
        const bucketName = process.env.COUCHBASE_BUCKET;
        const q = `SELECT META().id, p.* FROM \`${bucketName}\` p WHERE p.type='punch' ORDER BY p.createdAt DESC LIMIT 50`;
        const result = await cluster.query(q);
        const normalized = result.rows.map((r) => ({
          id: r.id,
          ...r.p,
        }));
        res.json(normalized);
      } catch (err) {
        console.error("Fetch punches error:", err);
        res.status(500).json({ error: "Failed to fetch punches" });
      }
    });

    // ✅ 5. Serve React Build
    const clientBuildPath = path.join(__dirname, "..", "client", "build");
    app.use(express.static(clientBuildPath));
    app.get("*", (req, res) =>
      res.sendFile(path.join(clientBuildPath, "index.html"))
    );

    // ✅ 6. Start Server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
  } catch (err) {
    console.error("Startup error:", err);
  }
})();






// const express = require("express");
// const cors = require("cors");
// const path = require("path");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Serve static frontend (React build)
// app.use(express.static(path.join(__dirname, "../client/build")));

// // Couchbase simulation or your DB code
// let punches = [];

// // API endpoints
// app.get("/api/punch", (req, res) => {
//   res.json(punches);
// });

// app.post("/api/punch", (req, res) => {
//   const { time, message } = req.body;
//   if (!time) return res.status(400).json({ error: "Time required" });
//   punches.push({ time, message });
//   res.status(201).json({ success: true });
// });

// // React route fallback
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/build", "index.html"));
// });

// // Important for Render: use process.env.PORT
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

