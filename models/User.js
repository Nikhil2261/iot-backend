// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   name: { type: String },
//   email: { type: String, unique: true, required: true },
//   password: { type: String, required: true }, // hashed password
// }, { timestamps: true });

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
