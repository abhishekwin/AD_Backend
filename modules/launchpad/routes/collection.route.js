const express = require("express");
// const auth = require('../../middlewares/auth');
const validate = require("../../../middleware/validate");
const {
  createCollectionValidation,
  updateCollectionValidation,
} = require("../validations/collection.validation");

// const manageMessageValidation = require('./validations/collection.validation');
const { checkAdminToken } = require("../../middleware/auth");
const {
  createWhiteListUser,
  verifyMinter,
  uploadFile,
} = require("../controllers/index");

const collectionController = require("../controllers/collection.controller");
//const secretkey = require('../../middlewares/secretkey');

const router = express.Router();

// For Notificcation
router
  .route("/create-collection")
  .post(
    validate(createCollectionValidation),
    collectionController.createCollection
  );

router.route("/create-whiteListedUser").post(createWhiteListUser);
router.route("/verifyMinter").post(verifyMinter);
router.route("/update-collection").patch(collectionController.updateCollection);
router
  .route("/update-collection-with-nft")
  .patch(
    validate(updateCollectionValidation),
    collectionController.updateCollectionWithNft
  );
router
  .route("/delete-collection/:id")
  .delete(collectionController.deleteCollection);
router
  .route("/get-collection-detail/:id")
  .get(collectionController.getCollection);
router
  .route("/get-collection-list")
  .post(collectionController.getCollectionList);
router
  .route("/approved-collection")
  .patch(checkAdminToken, collectionController.approvedCollection);

module.exports = router;
