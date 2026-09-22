const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");
const requireWriteAccess = require("../middlewares/requireWriteAccess");

router.get("/", customerController.index);
router.get("/:id", customerController.customer);
// router.post("/", customerController.create);
router.post("/add", requireWriteAccess, customerController.create); // - jeżeli ilość zapytań typu post byłaby większa to było by git, dla tak prostego kontrolera modelowy zapis jak wyżej
router.put("/edit/:id", requireWriteAccess, customerController.update);
// router.delete("/:id", customerController.delete);
router.delete("/delete/:id", requireWriteAccess, customerController.delete); // - jeżeli ilość zapytań typu delete byłaby większa to było by git, dla tak prostego kontrolera modelowy zapis jak wyżej

module.exports = router;