const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.post("/signup", userController.create);
router.get("/verify/:token", userController.verify);
router.post("/login", userController.login);
router.post("/logout", userController.logout);


module.exports = router;
