const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Auto-detect local IP (for LAN access)
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const LOCAL_IP = getLocalIP();
console.log("📡 Local IP Detected:", LOCAL_IP);

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `http://${LOCAL_IP}:3001/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl: fileUrl });
});

// Load entries
app.get("/entries", (req, res) => {
  let entries = [];
  if (fs.existsSync("entries.json")) {
    entries = JSON.parse(fs.readFileSync("entries.json"));
  }
  res.json(entries);
});

// Save entry
app.post("/entries", (req, res) => {
  let entries = [];

  if (fs.existsSync("entries.json")) {
    entries = JSON.parse(fs.readFileSync("entries.json"));
  }

  entries.unshift(req.body);
  fs.writeFileSync("entries.json", JSON.stringify(entries, null, 2));

  res.json({ success: true });
});

// Delete entry
app.delete("/entries/:index", (req, res) => {
  const idx = parseInt(req.params.index);

  let entries = JSON.parse(fs.readFileSync("entries.json"));

  if (idx >= 0 && idx < entries.length) {
    entries.splice(idx, 1);
  }

  fs.writeFileSync("entries.json", JSON.stringify(entries, null, 2));
  res.json({ success: true });
});

// Start server on LAN IP
app.listen(3001, LOCAL_IP, () => {
  console.log("🔥 Backend running!");
  console.log(`💻 Laptop: http://localhost:3001`);
  console.log(`📱 LAN (all devices): http://${LOCAL_IP}:3001`);
  console.log(`🖼 Uploads folder: http://${LOCAL_IP}:3001/uploads/`);
});
