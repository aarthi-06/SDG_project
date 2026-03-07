const express = require("express");
const router = express.Router();
const { loginUser } = require("../controllers/authController");

router.get("/test", (req, res) => {
  res.json({ message: "Auth route working" });
});

router.post("/login", loginUser);

module.exports = router;