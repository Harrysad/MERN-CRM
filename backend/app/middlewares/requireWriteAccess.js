const User = require("../models/UserModel");

module.exports = async (req, res, next) => {
  if (req.userRole === "viewer") {
    return res.status(403).json({
      message: "This action is not available on a read-only account.",
    });
  }
  if (req.userVerified === false) {
    try {
      const user = await User.findById(req.userId).select("verified");
      if (!user?.verified) {
        return res.status(403).json({
          message: "Please verify your email address to use this feature.",
        });
      }
    } catch (err) {
      return res.status(500).json({
        message: "Could not checkthe verification status.",
      });
    }
  }
  next();
};
