module.exports = (req, res, next) => {
  if (req.userRole === "viewer") {
    return res.status(403).json({
      message: "This action is not available on a read-only account.",
    });
  }
  if (req.userVerified === false) {
    return res.status(403).json({
      message: "Please verify your rmail address to use this feature."
    });
  }
  next();
};
