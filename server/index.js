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
// app.post("/api/punch", (req, res) => {
//   try {
//     //const { punchTime } = req.body;
//     const punchTime = req.body.punchTime || req.body.time;
//     const note = req.body.note || "";

//     // Validate input
//     if (!punchTime) {
//       return res.status(400).json({ error: "punchTime is required" });
//     }

//     const id = `punch_${Date.now()}`;
//     //const punch = { id, punchTime };
//     const punch = { id, time: punchTime, note, createdAt: new Date().toISOString() };
//     punches.push(punch);

//     console.log("✅ Punch saved:", punch);
//     //res.json({ success: true, id });
//     res.json({ success: true, punch });
//   } catch (err) {
//     console.error("❌ Error saving punch:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ✅ Get all punches
// app.get("/api/punches", (req, res) => {
//   res.json(punches);
// });

// Save punch - expects { time, note, user }
app.post("/api/punch", (req, res) => {
  try {
    const time = req.body.time || req.body.punchTime;
    const note = req.body.note || "";
    const user = req.body.user || null; // { name, email } expected

    if (!time) return res.status(400).json({ error: "time is required" });

    const id = `punch_${Date.now()}`;
    const punch = {
      id,
      time,
      note,
      user,
      createdAt: new Date().toISOString()
    };
    punches.push(punch);

    console.log("✅ Punch saved:", punch);
    res.json({ success: true, punch });
  } catch (err) {
    console.error("❌ Error saving punch:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/punches", (req, res) => {
  // Return most recent first
  const sorted = [...punches].sort((a,b) => (a.time < b.time ? 1 : -1));
  res.json(sorted);
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










