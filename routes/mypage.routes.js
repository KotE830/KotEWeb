const express = require("express");

const mypageController = require("../controllers/mypage.controller");

const router = express.Router();

router.get("/:username", mypageController.getMypage);

module.exports = router;