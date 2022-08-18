const express = require("express");
const validate = require("../../../middleware/validate");
const nftController = require("../controllers/nft.controller");
const fs = require("fs");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploaddir = appDir+ '/public/nft-files';
    if(!fs.existsSync(uploaddir)){
      fs.mkdirSync(uploaddir, 0744);
    }
    cb(null, "public/nft-files")
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