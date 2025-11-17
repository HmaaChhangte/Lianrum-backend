const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// CLOUDINARY SUPPORT
// ---------------------
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ---------------------
// MULTER MEMORY STORAGE
// ---------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------------
// IMAGE UPLOAD (Cloudinary)
// ---------------------
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const b64 = req.file.buffer.toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "lianrum_uploads",
      transformation: [{ width: 800, quality: "auto", crop: "scale" }],
    });

    res.json({ success: true, imageUrl: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ---------------------
// LOAD ENTRIES
// ---------------------
app.get("/entries", (req, res) => {
  let entries = [];
  if (fs.existsSync("entries.json")) {
    entries = JSON.parse(fs.readFileSync("entries.json"));
  }
  res.json(entries);
});

// ---------------------
// SAVE ENTRY
// ---------------------
app.post("/entries", (req, res) => {
  let entries = [];

  if (fs.existsSync("entries.json")) {
    entries = JSON.parse(fs.readFileSync("entries.json"));
  }

  entries.unshift(req.body);
  fs.writeFileSync("entries.json", JSON.stringify(entries, null, 2));

  res.json({ success: true });
});

// ---------------------
// DELETE ENTRY
// ---------------------
app.delete("/entries/:index", (req, res) => {
  const idx = parseInt(req.params.index);

  let entries = JSON.parse(fs.readFileSync("entries.json"));

  if (idx >= 0 && idx < entries.length) {
    entries.splice(idx, 1);
  }

  fs.writeFileSync("entries.json", JSON.stringify(entries, null, 2));
  res.json({ success: true });
});

// ---------------------
// START SERVER
// ---------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("🔥 Backend running on PORT " + PORT);
});
