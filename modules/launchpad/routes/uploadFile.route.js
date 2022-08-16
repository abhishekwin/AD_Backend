const express = require("express");
const { uploadFile } = require("../controllers/index");

const router = express.Router();

// For Notificcation
router.route("/").post(uploadFile);

module.exports = router;
