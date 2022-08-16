const express = require("express");
const validate = require("../../../middleware/validate");
const nftController = require("../controllers/nft.controller");

const router = express.Router();

// For Notificcation
router
  .route("/create-nft-with-upload-images")
  .post(
    nftController.createNft
  );

module.exports = router;