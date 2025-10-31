// ---------------- ENV & MODULES ----------------
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const User = require("./models/User");
const Device = require("./models/Device");
const PhysicalDevice = require("./models/PhysicalDevice");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------------- CONFIG ----------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PROV_TTL_MS = parseInt(process.env.PROV_TTL_MS || "600000", 10);

// ---------------- DATABASE CONNECT ----------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err));

// ---------------- LOGGERS ----------------

// 🧾 File logger setup (optional)
const logStream = fs.createWriteStream(path.join(__dirname, "server.log"), { flags: "a" });

// 🧠 Request Logger (runs on every request)
app.use((req, res, next) => {
  const time = new Date().toISOString();
  const log = `[${time}] ${req.method} ${req.originalUrl} from ${req.ip}\n`;
  process.stdout.write(log);
  logStream.write(log);
  next();
});

// ---------------- HELPER FUNCTIONS ----------------
function genToken(len = 24) {
  return crypto.randomBytes(len).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing token" });
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------- ROUTES ----------------

// Health check
app.get("/", (req, res) => res.send("IoT Backend with JWT ✅"));

// 🟢 User Signup
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    await new User({ name, email, password: hashed }).save();

    res.json({ ok: true, message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// 🟢 User Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ ok: true, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// 🟢 Request Provision Token
app.post("/request-provision", authMiddleware, async (req, res) => {
  try {
    const { device_id } = req.body;
    if (!device_id) return res.status(400).json({ error: "device_id required" });

    const prov_token = genToken(12);
    const expires = new Date(Date.now() + PROV_TTL_MS);

    await PhysicalDevice.findOneAndUpdate(
      { device_id },
      { $set: { prov_token, prov_expires: expires, owner: req.user.id } },
      { upsert: true, new: true }
    );

    res.json({ ok: true, prov_token, expires });
  } catch (err) {
    console.error("Provision error:", err);
    res.status(500).json({ error: "Provision request failed" });
  }
});

// 🟢 Device Activation
app.post("/device-activate", async (req, res) => {
  try {
    const { device_id, prov_token } = req.body;
    if (!device_id || !prov_token) return res.status(400).json({ error: "Missing fields" });

    const dev = await PhysicalDevice.findOne({ device_id });
    if (!dev) return res.status(400).json({ error: "Unknown device" });
    if (!dev.prov_token || !dev.prov_expires || new Date() > dev.prov_expires)
      return res.status(400).json({ error: "Provision token expired" });
    if (dev.prov_token !== prov_token) return res.status(400).json({ error: "Invalid provision token" });

    const deviceToken = genToken(24);
    dev.device_token_hash = hashToken(deviceToken);
    dev.prov_token = null;
    dev.prov_expires = null;
    await dev.save();

    res.json({ ok: true, device_token: deviceToken });
  } catch (err) {
    console.error("Activation error:", err);
    res.status(500).json({ error: "Device activation failed" });
  }
});

// 🟢 Device Config (device_id + token)
app.get("/device-config", async (req, res) => {
  try {
    const { device_id, token } = req.query;
    if (!device_id || !token) return res.status(400).json({ error: "Missing credentials" });

    const dev = await PhysicalDevice.findOne({ device_id });
    if (!dev || dev.device_token_hash !== hashToken(token))
      return res.status(401).json({ error: "Unauthorized" });

    dev.last_ping = new Date();
    await dev.save();

    const configs = await Device.find({ customer_id: dev.owner });
    res.json({
      ok: true,
      wifi: { ssid: dev.wifi_ssid, password: dev.wifi_password },
      devices: configs,
    });
  } catch (err) {
    console.error("Device config error:", err);
    res.status(500).json({ error: "Config fetch failed" });
  }
});

// 🟢 Update Device Status (Dashboard → Device)
app.post("/update-status", authMiddleware, async (req, res) => {
  try {
    const { pin, status, speed } = req.body;
    const device = await Device.findOne({ customer_id: req.user.id, pin });
    if (!device) return res.status(404).json({ error: "Device not found" });

    if (status) device.status = status;
    if (typeof speed !== "undefined") device.speed = speed;

    await device.save();
    res.json({ ok: true, status: device.status, speed: device.speed });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// 🟢 Remote Wi-Fi Update (Dashboard → Device)
app.post("/update-wifi", authMiddleware, async (req, res) => {
  try {
    const { device_id, ssid, password } = req.body;
    if (!ssid || !password) return res.status(400).json({ error: "Missing Wi-Fi details" });

    const dev = await PhysicalDevice.findOne({ device_id, owner: req.user.id });
    if (!dev) return res.status(404).json({ error: "Device not found" });

    dev.wifi_ssid = ssid;
    dev.wifi_password = password;
    await dev.save();

    res.json({ ok: true, message: "Wi-Fi credentials updated" });
  } catch (err) {
    console.error("Wi-Fi update error:", err);
    res.status(500).json({ error: "Wi-Fi update failed" });
  }
});

// 🟢 Feedback Ping (Device → Backend)
app.post("/ping", async (req, res) => {
  try {
    const { device_id, token, states } = req.body;
    if (!device_id || !token) return res.status(400).json({ error: "Missing credentials" });

    const dev = await PhysicalDevice.findOne({ device_id });
    if (!dev || dev.device_token_hash !== hashToken(token))
      return res.status(401).json({ error: "Unauthorized" });

    dev.last_ping = new Date();
    await dev.save();

    if (Array.isArray(states)) {
      for (const s of states) {
        await Device.findOneAndUpdate(
          { customer_id: dev.owner, pin: s.pin },
          {
            $set: {
              status: s.status || "off",
              speed: s.speed || 0,
              type: s.type || "switch",
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log(`📡 Ping from ${device_id} stored @ ${new Date().toISOString()}`);
    res.json({ ok: true, msg: "Ping + feedback stored" });
  } catch (err) {
    console.error("Ping error:", err);
    res.status(500).json({ error: "Ping failed" });
  }
});

// ---------------- OTA UPDATE ----------------
app.use("/firmware", express.static(path.join(__dirname, "firmware")));
app.get("/version.json", (req, res) => {
  res.sendFile(path.join(__dirname, "version.json"));
});

// ---------------- GLOBAL ERROR LOGGER ----------------
app.use((err, req, res, next) => {
  const time = new Date().toISOString();
  console.error(`\n❌ [${time}] Error in ${req.method} ${req.originalUrl}`);
  console.error(err.stack);
  res.status(500).json({ ok: false, error: "Internal Server Error", message: err.message });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
