// server/index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectCouchbase, getCollection, getCluster } = require("./couchbase");
const { validateToken } = require("./authMiddleware");

const app = express();

// ✅ 1. Strict CORS Configuration
const allowedOrigins = [
  "https://react-punch-app-1a2x.onrender.com", // your frontend Render app
  "http://localhost:3000", // local dev (optional)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed for this origin"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

app.use(express.json());

// ✅ 2. Connect to Couchbase and define routes inside async IIFE
(async () => {
  try {
    await connectCouchbase();

    // ✅ 3. Punch-In API (Protected by Azure token)
    app.post("/api/punch", validateToken, async (req, res) => {
      try {
        const { time } = req.body;
        if (!time) return res.status(400).json({ error: "time required" });

        // Extract user identity from Azure token
        const user =
          req.user?.preferred_username ||
          req.user?.upn ||
          req.user?.email ||
          req.user?.oid ||
          req.user?.sub ||
          "unknown_user";

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
        console.error("❌ Punch save error:", err);
        res.status(500).json({ error: "Failed to save punch" });
      }
    });

    // ✅ 4. Fetch Punches API
    app.get("/api/punches", async (req, res) => {
      try {
        const cluster = getCluster();
        const bucketName = process.env.COUCHBASE_BUCKET;
        const query = `
          SELECT META().id, p.*
          FROM \`${bucketName}\` p
          WHERE p.type = 'punch'
          ORDER BY p.createdAt DESC
          LIMIT 50;
        `;
        const result = await cluster.query(query);
        const punches = result.rows.map((r) => ({ id: r.id, ...r.p }));
        res.json(punches);
      } catch (err) {
        console.error("❌ Fetch punches error:", err);
        res.status(500).json({ error: "Failed to fetch punches" });
      }
    });

    // ✅ 5. Serve React Build (Render combined setup)
    const clientBuildPath = path.join(__dirname, "..", "client", "build");
    app.use(express.static(clientBuildPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });

    // ✅ 6. Start Server
    const PORT = process.env.PORT || 10000; // Render usually sets PORT automatically
    app.listen(PORT, () =>
      console.log(`🚀 Server started successfully on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server startup error:", err);
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

