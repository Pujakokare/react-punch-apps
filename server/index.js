const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend (React build)
app.use(express.static(path.join(__dirname, "../client/build")));

// Couchbase simulation or your DB code
let punches = [];

// API endpoints
app.get("/api/punch", (req, res) => {
  res.json(punches);
});

app.post("/api/punch", (req, res) => {
  const { time, message } = req.body;
  if (!time) return res.status(400).json({ error: "Time required" });
  punches.push({ time, message });
  res.status(201).json({ success: true });
});

// React route fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// Important for Render: use process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

