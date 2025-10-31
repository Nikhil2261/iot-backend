const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pin: { type: Number, required: true },
  type: { type: String, default: "switch" }, // switch / fan / light
  status: { type: String, default: "off" },
  speed: { type: Number, default: 0 },       // fan speed 0–100
            
}, { timestamps: true });

module.exports = mongoose.model("Device", deviceSchema);



// const mongoose = require("mongoose");

// const deviceSchema = new mongoose.Schema({
//   customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   pin: { type: Number, required: true },
//   type: { type: String, default: "switch" },
//   status: { type: String, default: "off" }
// }, { timestamps: true });

// module.exports = mongoose.model("Device", deviceSchema);



// models/Device.js
// const mongoose = require("mongoose");

// const deviceSchema = new mongoose.Schema({
//   customer_id: { type: String, required: true },
//   pin: { type: Number, required: true },
//   type: { type: String, required: true },
//   status: { type: String, required: true }
// });

// module.exports = mongoose.model("Device", deviceSchema);
