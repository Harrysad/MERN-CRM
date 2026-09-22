const mongoose = require("mongoose");

const Action = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  type: {
    type: String,
    required: true,
    enum: ["Telefon", "Spotkanie", "Mail", "Wideo rozmowa"],
  },
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
