const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const { loginLimiter, signupLimiter } = require("../middlewares/rateLimiters");

router.post("/signup", signupLimiter, userController.create);
router.get("/verify/:token", userController.verify);
router.post(
  "/resend-verification",
  authMiddleware,
  userController.resendVerification,
);
router.get(
  "/verification-status",
  authMiddleware,
  userController.verificationStatus,
);
router.post("/login", loginLimiter, userController.login);
router.post("/logout", userController.logout);

module.exports = router;
