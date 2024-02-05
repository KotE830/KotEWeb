const express = require("express");

const router = express.Router();

router.get("/signup", function(req, res) {
  res.render("auth/signup");
});

router.get("/login", function(req, res) {
  res.render("auth/login")
});

module.exports = router;