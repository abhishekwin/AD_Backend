const express = require("express");
const validate = require("../../../middleware/validate");
const nftController = require("../controllers/nft.controller");
const fs = require("fs");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);
const multer = require("multer");
const { checkAdminToken, checkToken } = require("../../middleware/auth");

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
router.post("/get-nft-list", nftController.getNftList);
router.post("/get-my-nft-list", checkToken,  nftController.getMyNftList);
router.get("/get-nft-detail/:id", nftController.nftDetail);
module.exports = router;