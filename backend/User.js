const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  portfolio: {
    balance: { type: Number, default: 100000 },
    holdings: { type: Array, default: [] }
  }
});

module.exports = mongoose.model("User", userSchema);
