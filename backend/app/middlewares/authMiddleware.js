const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const RevokedToken = require("../models/RevokedTokenModel");
const sendServerError = require("../helpers/sendServerError");
const { COOKIE_NAME } = require("../helpers/authCookie");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

module.exports = async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      message: "Access denied",
    });
  }

  if (
    !SAFE_METHODS.includes(req.method) &&
    req.header("X-Requested-With") !== "XMLHttpRequest"
  ) {
    return res.status(403).json({
      message: "Missing CSRF header",
    });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  if (!payload.jti) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  try {
    const [revoked, user] = await Promise.all([
      RevokedToken.exists({ jti: payload.jti }),
      User.findById(payload._id).select("role verified"),
    ]);

    if (revoked || !user) {
      return res.status(401).json({
        message: "Session has ended",
      });
    }

    req.userId = payload._id;
    req.userRole = user.role;
    req.userVerified = user.verified;
    next();
  } catch (err) {
    sendServerError(res, err);
  }
};
