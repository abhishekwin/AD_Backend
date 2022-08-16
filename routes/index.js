const express = require("express");
const collectionRoute = require("../modules/launchpad/routes/collection.route");
const uploadFileRoute = require("../modules/launchpad/routes/uploadFile.route");
const router = express.Router();
router.use("/collection", collectionRoute);
router.use("/file-upload", uploadFileRoute);

module.exports = router;
