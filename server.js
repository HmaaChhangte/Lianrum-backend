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
