const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("Authorization");
  if (token) {
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = verified._id;
      req.userRole = verified.role;
      req.userVerified = verified.verified;
      next();
    } catch (err) {
      res.status(400).json({
        message: "Invalid token",
      });
    }
  } else {
    res.status(401).json({
      message: "Access denied",
    });
  }
};
