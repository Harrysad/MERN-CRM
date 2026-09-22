module.exports = (req, res, next) => {
  if (req.userRole === "viewer") {
    return res.status(403).json({
      message: "This action is not available on a read-only account.",
    });
  }
  next();
};
