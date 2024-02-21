const express = require("express");

const contentsController = require("../controllers/contents.controllers");

const router = express.Router();

router.get("/", contentsController.getContents);

router.get("/new", contentsController.createNewContent);

module.exports = router;
