const express = require("express");
const collectionRoute = require("../modules/launchpad/routes/collection.route");
const uploadFileRoute = require("../modules/launchpad/routes/uploadFile.route");
const nftRoute = require("../modules/launchpad/routes/nft.route");
const adminSetting = require("../modules/launchpad/routes/admin.route")
const currencyRouter = require("../modules/launchpad/routes/currency.routes")
const validate = require("../middleware/validate");
const nftController = require("../modules/launchpad/controllers/nft.controller");
const {
    getS3JsonFileValidation
  } = require("../modules/launchpad/validations/nft.validation");

const router = express.Router();
router.use("/collection", collectionRoute);
router.use("/file-upload", uploadFileRoute);
router.use("/nft", nftRoute);
router.use("/admin", adminSetting);
router.use("/currency", currencyRouter)
router.get("/:networkId/:collectionAddress/:fileName", validate(getS3JsonFileValidation), nftController.getS3JsonFile);


module.exports = router;
