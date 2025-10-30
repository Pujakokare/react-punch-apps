const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectCouchbase, getCollection } = require('./couchbase');
const { validateToken } = require('./authMiddleware');

const app = express();

// ✅ Allow only your frontend
app.use(
  cors({
    origin: [
      'https://react-punch-app-1a2x.onrender.com', // your frontend
      'http://localhost:3000' // optional for local dev
    ],
   // methods: ['GET', 'POST'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

app.use(express.json());

// Connect to Couchbase etc.
(async () => {
  try {
    await connectCouchbase();

    app.post('/api/punch', validateToken, async (req, res) => {
      try {
        const { time } = req.body;
        if (!time) return res.status(400).json({ error: 'time required' });
        const user = req.user && (req.user.preferred_username || req.user.upn || req.user.email || req.user.oid || req.user.sub);

        const collection = getCollection();
        const doc = { type: 'punch', time, createdAt: new Date().toISOString(), user };
        const id = `punch::${Date.now()}::${Math.random().toString(36).slice(2)}`;
        await collection.insert(id, doc);

        res.status(201).json({ id, ...doc });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to save' });
      }
    });

    app.get('/api/punches', async (req, res) => {
      // Use N1QL query or dedicated listing logic; keep it simple if you prefer
      // For demonstration: return last 50 docs with type == 'punch'
      const cluster = require('./couchbase').getCluster();
      const bucketName = process.env.COUCHBASE_BUCKET;
      const q = `SELECT meta().id, p.* FROM \`${bucketName}\` p WHERE p.type='punch' ORDER BY p.createdAt DESC LIMIT 50`;
      const result = await cluster.query(q);
      const normalized = result.rows.map(r => ({ id: r.id, ...r.p }));
      res.json(normalized);
    });

    // serve client build (unchanged)
    const clientBuildPath = path.join(__dirname, '..', 'client', 'build'); // CRA build location
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => res.sendFile(path.join(clientBuildPath, 'index.html')));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server started on ${PORT}`));
  } catch (err) {
    console.error('Startup error', err);
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

