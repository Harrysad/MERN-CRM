const express = require("express");
const router = express.Router();

const nipController = require("../controllers/nipController");

router.get("/:nip", nipController.lookup);

module.exports = router;