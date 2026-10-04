const crypto = require("crypto");

const safeEqual = (a, b) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

module.exports = (req, res, next) => {
  const expected = process.env.INTERNAL_CLEANUP_SECRET;

  if (!expected) {
    return res.status(503).json({
      message: "Internal cleanup is not configured.",
    });
  }

  const provided = req.header("X-Internal-Secret");
  if (!provided || !safeEqual(provided, expected)) {
    return res.status(401).json({
      message: "Access denied",
    });
  }

  next();
};
