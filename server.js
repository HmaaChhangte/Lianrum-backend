// ---------------------------
//  Lianrum Backend (Fixed)
// ---------------------------
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

// ---------------------------
//  CLOUDINARY CONFIG
// ---------------------------
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ---------------------------
const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------
// Multer memory storage (upload to Cloudinary)
// ---------------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------------------
// Upload Route (Cloudinary)
// ---------------------------
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const uploadResult = await cloudinary.uploader.upload_stream(
      { folder: "lianrum_uploads" },
      (error, result) => {
        if (error) return res.status(500).json({ error });

        return res.json({
          success: true,
          imageUrl: result.secure_url,
        });
      }
    );

    // Send buffer to Cloudinary
    uploadResult.end(req.file.buffer);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ---------------------------
// Load entries
// ---------------------------
app.get("/entries", (req, res) => {
  let entries = [];

  if (fs.existsSync("entries.json")) {
    entries = JSON.parse(fs.readFileSync("entries.json"));
  }

  res.json(entries);
});

// ---------------------------
// Save entry
// ---------------------------
app.post("/entries", (req, res) => {
  let entries = [];

  if (fs.existsSync("entries.json")) {
    entries = JSON.parse(fs.readFileSync("entries.json"));
  }

  entries.unshift(req.body);
  fs.writeFileSync("entries.json", JSON.stringify(entries, null, 2));

  res.json({ success: true });
});

// ---------------------------
// Delete entry
// ---------------------------
app.delete("/entries/:index", (req, res) => {
  const idx = parseInt(req.params.index);

  let entries = [];
  if (fs.existsSync("entries.json")) {
    entries = JSON.parse(fs.readFileSync("entries.json"));
  }

  if (idx >= 0 && idx < entries.length) {
    entries.splice(idx, 1);
  }

  fs.writeFileSync("entries.json", JSON.stringify(entries, null, 2));

  res.json({ success: true });
});

// ---------------------------
// Start server (LOCAL + RENDER)
// ---------------------------
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🔥 Backend running on port ${PORT}`);
});
