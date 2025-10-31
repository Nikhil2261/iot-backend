const mongoose = require("mongoose");

const physicalDeviceSchema = new mongoose.Schema({
  device_id: { type: String, required: true, unique: true },   // hardware MAC / ID
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  device_token_hash: { type: String, default: null },
  prov_token: { type: String, default: null },
  prov_expires: { type: Date, default: null },
  last_ping: { type: Date, default: null },

  
  // NEW: Wi-Fi credentials (board-level, not per pin)
  wifi_ssid: { type: String, default: null },
  wifi_password: { type: String, default: null }
  
}, { timestamps: true });

module.exports = mongoose.model("PhysicalDevice", physicalDeviceSchema);
