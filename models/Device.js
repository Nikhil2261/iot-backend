


// const mongoose = require("mongoose");

// const deviceSchema = new mongoose.Schema({
//   customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   pin: { type: Number, required: true },
//   type: { type: String, default: "switch" }, // switch / fan / light
//   status: { type: String, default: "off" },
//   speed: { type: Number, default: 0 },       // fan speed 0–100
//   origin: { type: String, default: "app" },  // NEW — "device" or "app"
// }, { timestamps: true });

// module.exports = mongoose.model("Device", deviceSchema);


const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  customer_id: { type: String, required: true },
  pin: { type: Number, required: true },
  status: { type: String, default: "off" },
  speed: { type: Number, default: 0 },
  type: { type: String, default: "switch" }, // light/switch/fan
  origin: { type: String, default: "app" }, // 'app' or 'device'
  updatedAt: { type: Date, default: Date.now },
  last_changed_ms: { type: Number, default: 0 } // numeric timestamp used for ordering
});

// unique index at collection-level is created on startup in server.js
module.exports = mongoose.model("Device", DeviceSchema);

