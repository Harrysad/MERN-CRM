const express = require("express");
const router = express.Router();

const actionController = require("../controllers/actionController");

router.post("/add", actionController.create);
router.put("/edit/:id", actionController.update);
router.delete("/delete/:id", actionController.delete);

module.exports = router;
