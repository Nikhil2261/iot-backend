const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Serve static firmware files
app.use("/firmware", express.static(path.join(__dirname, "firmware")));

// In-memory device config
let devices = {
  cust123: [
    { pin: 14, type: "light", status: "off" },
    { pin: 27, type: "fan", status: "off" }
  ]
};

// 1. Return device config to ESP32
app.get("/device-config", (req, res) => {
  const { customer_id } = req.query;
  const config = devices[customer_id];
  if (config) {
    res.json(config);
  } else {
    res.status(404).json({ error: "No config for this customer_id" });
  }
});

// 2. Update device status from app
app.post("/update-status", (req, res) => {
  const { customer_id, pin, status } = req.body;
  const devs = devices[customer_id];
  if (!devs) return res.status(404).json({ error: "Invalid customer_id" });

  const dev = devs.find(d => d.pin === pin);
  if (!dev) return res.status(404).json({ error: "Invalid pin" });

  dev.status = status;
  res.json({ success: true });
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
