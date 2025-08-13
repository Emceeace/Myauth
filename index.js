const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// Storage file
const DB_FILE = "database.json";
let db = { users: [], keys: [] };

// Load DB if it exists
if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE));
}

// Save DB to file
function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

app.use(bodyParser.json());

// Generate random key
function generateKey() {
    return crypto.randomBytes(8).toString("hex").toUpperCase();
}

// === API Endpoints ===

// Generate a new license key
app.post("/generate-key", (req, res) => {
    const key = generateKey();
    db.keys.push({ key, used: false, banned: false });
    saveDB();
    res.json({ success: true, key });
});

// Ban a key
app.post("/ban-key", (req, res) => {
    const { key } = req.body;
    const keyObj = db.keys.find(k => k.key === key);
    if (!keyObj) return res.json({ success: false, message: "Key not found" });
    keyObj.banned = true;
    saveDB();
    res.json({ success: true });
});

// Delete a key
app.post("/delete-key", (req, res) => {
    const { key } = req.body;
    db.keys = db.keys.filter(k => k.key !== key);
    saveDB();
    res.json({ success: true });
});

// Register user
app.post("/register", (req, res) => {
    const { username, password, license } = req.body;
    const keyObj = db.keys.find(k => k.key === license);

    if (!keyObj) return res.json({ success: false, message: "Invalid license" });
    if (keyObj.used) return res.json({ success: false, message: "License already used" });
    if (keyObj.banned) return res.json({ success: false, message: "License banned" });
    if (db.users.find(u => u.username === username)) return res.json({ success: false, message: "Username taken" });

    db.users.push({ username, password });
    keyObj.used = true;
    saveDB();
    res.json({ success: true });
});

// Login user
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) return res.json({ success: false, message: "Invalid credentials" });
    res.json({ success: true });
});

// Validate key (optional if you need direct key check without account)
app.post("/validate-key", (req, res) => {
    const { key } = req.body;
    const keyObj = db.keys.find(k => k.key === key);
    if (!keyObj) return res.json({ success: false, message: "Key not found" });
    if (keyObj.banned) return res.json({ success: false, message: "Key banned" });
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`KeyAuth clone running on port ${PORT}`);
});
