const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary");

const app = express();

// CORS
app.use(cors({
  origin: "*",
  methods: "GET,POST,DELETE",
  allowedHeaders: "Content-Type",
}));

app.use(express.json());

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer local temp storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Cloudinary upload route
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const uploadPath = path.join(__dirname, "uploads", req.file.filename);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(uploadPath, {
      folder: "lianrum_diary",
    });

    // Remove local temp file
    fs.unlinkSync(uploadPath);

    res.json({
      success: true,
      imageUrl: result.secure_url,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Debug route - Read entries.json
app.get("/debug-entries", (req, res) => {
  try {
    if (!fs.existsSync("entries.json")) {
      return res.json([]);
    }
    const entries = JSON.parse(fs.readFileSync("entries.json"));
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load entries.json" });
  }
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

// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
