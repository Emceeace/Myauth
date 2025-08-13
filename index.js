const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIG ===
const ADMIN_PASSWORD = "acerenard1";  // Must match your Discord bot
const DB_FILE = "database.json";

// === CORS & Body Parser ===
app.use(cors());
app.use(bodyParser.json());

// === Database ===
let db = { users: [], keys: [] };
if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// === Helpers ===
function generateKey() {
    return crypto.randomBytes(8).toString("hex").toUpperCase();
}

function checkAdmin(req, res) {
    if (!req.body.admin_password || req.body.admin_password !== ADMIN_PASSWORD) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return false;
    }
    return true;
}

// === API ENDPOINTS ===

// Root route
app.get("/", (req, res) => {
    res.send("KeyAuth clone server is running!");
});

// Generate a new license key
app.post("/generate-key", (req, res) => {
    if (!checkAdmin(req, res)) return;
    const key = generateKey();
    db.keys.push({ key, used: false, banned: false });
    saveDB();
    res.json({ success: true, key });
});

// Ban a key
app.post("/ban-key", (req, res) => {
    if (!checkAdmin(req, res)) return;
    const { key } = req.body;
    const keyObj = db.keys.find(k => k.key === key);
    if (!keyObj) return res.json({ success: false, message: "Key not found" });
    keyObj.banned = true;
    saveDB();
    res.json({ success: true });
});

// Unban a key
app.post("/unban-key", (req, res) => {
    if (!checkAdmin(req, res)) return;
    const { key } = req.body;
    const keyObj = db.keys.find(k => k.key === key);
    if (!keyObj) return res.json({ success: false, message: "Key not found" });
    keyObj.banned = false;
    saveDB();
    res.json({ success: true });
});

// Delete a key
app.post("/remove-key", (req, res) => {
    if (!checkAdmin(req, res)) return;
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

// Validate key (optional direct check)
app.post("/validate-key", (req, res) => {
    const { key } = req.body;
    const keyObj = db.keys.find(k => k.key === key);
    if (!keyObj) return res.json({ success: false, message: "Key not found" });
    if (keyObj.banned) return res.json({ success: false, message: "Key banned" });
    res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`KeyAuth clone running on port ${PORT}`);
});
