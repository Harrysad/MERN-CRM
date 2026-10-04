const express = require("express");
const router = express.Router();

const internalController = require("../controllers/internalController");
const requireInternalSecret = require("../middlewares/requireInternalSecret");

router.post(
  "/cleanup-unverified",
  requireInternalSecret,
  internalController.cleanupUnverified,
);

module.exports = router;
