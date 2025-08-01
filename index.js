const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const Device = require("./models/Device");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/iotproject", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Serve static firmware files
app.use("/firmware", express.static(path.join(__dirname, "firmware")));

// 1. Return device config to ESP32
app.get("/device-config", async (req, res) => {
  const { customer_id } = req.query;
  try {
    const config = await Device.find({ customer_id });
    if (config.length === 0) {
      return res.status(404).json({ error: "No config for this customer_id" });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 2. Update device status from app
app.post("/update-status", async (req, res) => {
  const { customer_id, pin, status } = req.body;
  try {
    const device = await Device.findOne({ customer_id, pin });
    if (!device) {
      return res.status(404).json({ error: "Invalid customer_id or pin" });
    }

    device.status = status;
    await device.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 3. ESP32 heartbeat
app.get("/ping", (req, res) => {
  const { customer_id } = req.query;
  console.log(`📡 Ping from ${customer_id} @ ${new Date().toISOString()}`);
  res.sendStatus(200);
});

// 4. Serve OTA version info
app.get("/version.json", (req, res) => {
  res.sendFile(path.join(__dirname, "version.json"));
});

app.listen(PORT, () => {
  console.log(`✅ IoT Backend running on port ${PORT}`);
});
