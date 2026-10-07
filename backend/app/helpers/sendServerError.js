const { setDefaultHighWaterMark } = require("supertest/lib/test");

const sendServerError = (res, err) => {
  console.error("Server error: ", err);
  res.status(500).json({
    error: true,
    message: "Internal server error.",
  });
};

module.exports = sendServerError;
