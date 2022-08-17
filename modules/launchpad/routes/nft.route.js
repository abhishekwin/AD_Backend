const express = require("express");
const validate = require("../../../middleware/validate");
const nftController = require("../controllers/nft.controller");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, "public/files")
  },
filename: function (req, file, cb) { cb(null, file.originalname) }
})
const router = express.Router();

// For Notificcation
// router
//   .route("/create-nft-with-upload-images")
//   .post(
//     nftController.createNft
//   );
const upload = multer({ storage })
router.post("/create-nft-with-upload-images", upload.array("files"), nftController.createNft);
module.exports = router;