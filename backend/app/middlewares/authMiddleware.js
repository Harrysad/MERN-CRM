const jwt = require("jsonwebtoken");
const { COOKIE_NAME } = require("../helpers/authCookie");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

module.exports = (req, res, next) => {
  const headerToken = req.header("Authorization");
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({
      message: "Access denied",
    });
  }

  const usesCookie = !headerToken;
  if (
    usesCookie &&
    !SAFE_METHODS.includes(req.method) &&
    req.header("X-Requested-With") !== "XMLHttpRequest"
  ) {
    return res.status(403).json({
      message: "Missing CSRF header",
    });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified._id;
    req.userRole = verified.role;
    req.userVerified = verified.verified;
    next();
  } catch (err) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};
