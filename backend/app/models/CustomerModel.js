const mongoose = require("mongoose");

const Customer = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    suite: { type: String, required: true },
    city: { type: String, required: true },
    postcode: { type: String, required: true },
  },
  nip: { type: String, required: true, unique: true },
  actions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Action",
    },
  ],
});

Customer.index({ owner: 1, nip: 2 }, { unique: true });

module.exports = mongoose.model("Customer", Customer);
