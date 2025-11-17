const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

// CORS for Render + Vercel + Localhost
app.use(cors({
  origin: "*",
  methods: "GET,POST,DELETE",
  allowedHeaders: "Content-Type",
}));

app.use(express.json());

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `${process.env.RENDER_EXTERNAL_URL}/uploads/${req.file.filename}`;
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

// Render PORT
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
