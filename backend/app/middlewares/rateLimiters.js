const { rateLimit } = require("express-rate-limit");

const skipInTests = () => process.env.NODE_ENV === "test";

const createRateLimiter = ({ message, ...options }) =>
  rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: true, message },
    ...options,
  });

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  skip: skipInTests,
  message: "Too many failed login attempts. Try again in a few minutes.",
});

const signupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  skip: skipInTests,
  message: "Too many signup attempts. Try again later.",
});

const nipLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  skip: skipInTests,
  message: "Too many lookups. Try again in a minute.",
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  signupLimiter,
  nipLimiter,
};
