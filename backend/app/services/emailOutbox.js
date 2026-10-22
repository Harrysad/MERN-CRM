const EmailMessage = require("../models/EmailMessageModel");
const { sendEmail } = require("./emailService");

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [60 * 1000, 5 * 60 * 1000];
const LEASE_MS = 2 * 60 * 1000;
const BATCH_SIZE = 20;
const WORKER_INTERVAL_MS = 60 * 1000;

const attemptDelivery = async (message, now = new Date()) => {
  const attempts = message.attempts + 1;

  try {
    await sendEmail({
      to: message.to,
      subject: message.subject,
      html: message.html,
    });
  } catch (err) {
    const giveUp = attempts >= MAX_ATTEMPTS;
    const update = {
      $set: {
        attempts,
        lastError: String(err.message).slice(0, 300),
        status: giveUp ? "failed" : "pending",
      },
    };

    if (giveUp) {
      update.$unset = { html: "" };
      console.error(
        "E-mail nie został wysłany po kilku próbach: ",
        err.message,
      );
    } else {
      update.$set.nextAttemptAt = new Date(
        now.getTime() + RETRY_DELAYS_MS[attempts - 1],
      );
    }

    await EmailMessage.updateOne({ _id: message._id }, update);
    return update.$set.status;
  }

  await EmailMessage.updateOne(
    { _id: message._id },
    {
      $set: { status: "sent", sentAt: now, attempts, lastError: null },
      $unset: { html: "" },
    },
  );
  return "sent";
};

const enqueueEmail = async ({ kind, user = null, to, subject, html }) => {
  const message = await EmailMessage.create({
    kind,
    user,
    to,
    subject,
    html,
    nextAttemptAt: new Date(Date.now() + LEASE_MS),
  });

  return attemptDelivery(message);
};

const processOutbox = async (now = new Date()) => {
  let processed = 0;

  for (let i = 0; i < BATCH_SIZE; i++) {
    const message  = await EmailMessage.findOneAndUpdate(
      {
        status: "pending",
        nextAttemptAt: { $lte: now },
      },
      { $set: { nextAttemptAt: new Date(now.getTime() + LEASE_MS) } },
      { sort: { nextAttemptAt: 1 } },
    );
    if (!message) break;

    await attemptDelivery(message, now);
    processed += 1;
  }
  return processed;
};

const startOutboxWorker = (intervalMs = WORKER_INTERVAL_MS) => {
  const timer = setInterval(() => {
    processOutbox().catch((err) =>
      console.error("Błąd przetwarzania kolejki e-maili: ", err),
    );
  }, intervalMs);
  timer.unref();
  return timer;
};

const getLatestEmailStatus = async (userId, kind) => {
  const message = await EmailMessage.findOne({ user: userId, kind })
    .sort({ createdAt: -1, _id: -1 })
    .select("status");
  return message ? message.status : null;
};

const getOutboxStats = async () => {
  const counts = await EmailMessage.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const stats = { pending: 0, sent: 0, failed: 0 };
  counts.forEach(({ _id, count }) => {
    stats[_id] = count;
  });

  const recentFailures = await EmailMessage.find({ lastError: { $ne: null } })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select("kind status attempts lastError updatedAt -_id")
    .lean();

  return { ...stats, recentFailures };
};

module.exports = {
  enqueueEmail,
  processOutbox,
  startOutboxWorker,
  getLatestEmailStatus,
  getOutboxStats,
};
