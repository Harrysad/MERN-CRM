const mongoose = require("mongoose");

const Action = new mongoose.Schema({
  type: String,
  description: String,
  date: {
    type: Date,
    default: Date.now,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
});

module.exports = mongoose.model("Action", Action);
