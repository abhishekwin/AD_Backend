const express = require("express");
const router = express.Router();
const { checkToken } = require("../middleware/auth");
const { uploadUserPhoto } = require("../middleware/uploadfile");
const {
  uploadFile,
  uploadJson,
  uploadMultiJsonData,
  pinHash
} = require("../controllers");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, "public/files")
  },
filename: function (req, file, cb) { cb(null, file.originalname) }
})

const upload = multer({ storage })
router.post("/uploadFile", upload.single("file"), uploadFile);

router.post("/uploadJosn", uploadJson);
router.post("/uploadMultiJsonData", upload.single("metadata"), uploadMultiJsonData);
router.post("/pinHash", pinHash);
module.exports = router;