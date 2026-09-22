const express = require("express");
const router = express.Router();

const actionController = require("../controllers/actionController");
const requireWriteAccess = require("../middlewares/requireWriteAccess");

router.get("/:customerId", actionController.index); //!!!!
router.post("/add", requireWriteAccess, actionController.create);
router.put("/edit/:id", requireWriteAccess, actionController.update);
router.delete("/delete/:id", requireWriteAccess, actionController.delete);

module.exports = router;
