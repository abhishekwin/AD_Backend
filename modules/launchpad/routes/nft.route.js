const express = require("express");
const validate = require("../../../middleware/validate");
const nftController = require("../controllers/nft.controller");
const { checkAdminToken, checkToken } = require("../../middleware/auth");
const multer = require("multer");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);
const fs = require("fs")
const {
  getS3JsonFileValidation
} = require("../validations/nft.validation");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploaddir = appDir+ '/public/files';
    if(!fs.existsSync(uploaddir)){
      fs.mkdirSync(uploaddir, 0744);
    }
    cb(null, "public/files")
  },
  filename: function (req, file, cb) { cb(null, file.originalname) }
})

const upload = multer({ storage })
const router = express.Router();

// For Notificcation
// router
//   .route("/create-nft-with-upload-images")
//   .post(
//     nftController.createNft
//   );

// router.post("/create-nft-with-upload-images", upload.array("files"), nftController.createNft);
router.post("/upload-multi-json-to-pinata", upload.single("metadata"), nftController.uploadMultiJsonToPinata);

router.post("/get-nft-list", nftController.getNftList);
router.post("/get-my-nft-list", checkToken,  nftController.getMyNftList);
router.get("/get-nft-detail/:id", nftController.nftDetail);
router.post("/get-nft-attributes", nftController.getNftAttributes);
router.post("/get-s3-json-file", checkToken, validate(getS3JsonFileValidation), nftController.getS3JsonFile);
// router.post("/create-static-nft", checkToken, nftController.createStaticNft);
// router.post("/update-static-nft", checkToken, nftController.updateStaticNft);
// router.post("/update-multi-static-nft", checkToken, nftController.updateManyStaticNft);
module.exports = router;