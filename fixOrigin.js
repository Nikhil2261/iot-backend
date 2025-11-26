const mongoose = require("mongoose");
const Device = require("./models/Device");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected ✔");

    const res = await Device.updateMany(
      { origin: { $exists: false } },
      { $set: { origin: "app" } }
    );

    console.log("Updated:", res.modifiedCount);
    process.exit();
  })
  .catch(err => console.error(err));
