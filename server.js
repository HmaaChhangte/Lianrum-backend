const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

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

// Multer temp storage (not permanent)
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ✅ FIXED UPLOAD ROUTE — Cloudinary
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const uploadPath = path.join(__dirname, "uploads", req.file.filename);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(uploadPath, {
      folder: "lianrum_diary",
    });

    // Remove temp local file
    fs.unlinkSync(uploadPath);

    // Return Cloudinary URL
    res.json({
      success: true,
      imageUrl: result.secure_url,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});
app.get("/debug-entries", (req, res) => {
  try {
    if (!fs.existsSync("entries.json")) {
      return res.json([]);
    }
    const entries = JSON.parse(fs.readFileSync("entries.json"));
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Could not load entries.json" });
  }
});
