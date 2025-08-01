// models/Device.js
const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  customer_id: { type: String, required: true },
  pin: { type: Number, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true }
});

module.exports = mongoose.model("Device", deviceSchema);
