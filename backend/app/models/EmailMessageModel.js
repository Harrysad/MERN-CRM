const mongoose = require("mongoose");

const EmailMessage = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["verification", "deletion"],
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    to: { type: String, require: true },
    subject: { type: String, require: true },
    html: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: null },
    nextAttemptAt: { type: Date, default: Date.now },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

EmailMessage.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
EmailMessage.index({ status: 1, nextAttemptAt: 1 });
EmailMessage.index({ user: 1, kind: 1, createdAt: -1 });

module.exports = mongoose.model("EmailMessage", EmailMessage);
