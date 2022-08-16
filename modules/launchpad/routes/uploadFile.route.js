const express = require("express");
const { uploadFile } = require("../controllers/index");

const router = express.Router();

// For Notificcation
router.route("/upload-file").post(uploadFile);

module.exports = router;
