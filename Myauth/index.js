const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(cors());

// Store keys in memory (for real projects, use a database)
let keys = [];

// Generate a random key
function generateKey() {
  return crypto.randomBytes(4).toString("hex").toUpperCase() + "-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// Route: generate a new key
app.post("/generate-key", (req, res) => {
  const newKey = generateKey();
  keys.push(newKey);
  res.json({ success: true, key: newKey });
});

// Route: validate a key
app.post("/validate-key", (req, res) => {
  const { key } = req.body;
  if (!key) return res.json({ success: false, message: "No key provided" });

  if (keys.includes(key)) {
    res.json({ success: true, message: "Valid key!" });
  } else {
    res.json({ success: false, message: "Invalid key!" });
  }
});

// Route: list all keys (for testing purposes)
app.get("/keys", (req, res) => {
  res.json({ keys });
});

// Root route
app.get("/", (req, res) => {
  res.send("KeyAuth clone is running!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
