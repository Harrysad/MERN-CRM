const express = require("express");
const router = express.Router();

const internalController = require("../controllers/internalController");
const requireInternalSecret = require("../middlewares/requireInternalSecret");

router.post(
  "/cleanup-accounts",
  requireInternalSecret,
  internalController.cleanupAccounts,
);

module.exports = router;
