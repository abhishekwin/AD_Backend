const express = require("express");
const collectionRoute = require("../modules/launchpad/routes/collection.route");
const uploadFileRoute = require("../modules/launchpad/routes/uploadFile.route");
const nftRoute = require("../modules/launchpad/routes/nft.route");
const adminSetting = require("../modules/launchpad/routes/admin.route") 
const router = express.Router();
router.use("/collection", collectionRoute);
router.use("/file-upload", uploadFileRoute);
router.use("/nft", nftRoute);
router.use("/admin", adminSetting);

module.exports = router;
