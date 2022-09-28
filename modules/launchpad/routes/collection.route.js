const express = require("express");
// const auth = require('../../middlewares/auth');
const validate = require("../../../middleware/validate");
const {
  createCollectionValidation,
  updateCollectionValidation,
} = require("../validations/collection.validation");
const { createWhiteListedValidation } = require('../validations/whiteListed.validation')
// const manageMessageValidation = require('./validations/collection.validation');
const { checkAdminToken, checkToken } = require("../../middleware/auth");
const {
  createWhiteListUser,
  updateWhiteListUser,
  createSignature,
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

router.route("/create-whiteListedUser").post( checkToken, createWhiteListUser);
router.route("/update-whiteListedUser").post( checkToken, updateWhiteListUser);
router.route("/create-signature").post(checkToken, validate( createWhiteListedValidation), createSignature);

router.route("/update-collection").patch(collectionController.updateCollection);
router
  .route("/update-collection-with-nft")
  .patch(
    checkToken,
    validate(updateCollectionValidation),
    collectionController.updateCollectionWithNft
  );
router
  .route("/delete-collection/:id")
  .delete( checkToken, collectionController.deleteCollection);
router
  .route("/get-collection-detail/:id")
  .get(collectionController.getCollection);
router
  .route("/get-collection-list")
  .post(collectionController.getCollectionList);
router
  .route("/approved-collection")
  .patch(checkAdminToken, collectionController.approvedCollection);

router
  .route("/get-stash-collections-header")
  .post(collectionController.stashCollectionHeader);  
router
  .route("/get-stash-all-collections-header")
  .get(collectionController.stashAllCollectionHeader);   
router
  .route("/get-top-creator")
  .post(collectionController.topCreator); 
router
  .route("/get-latest-creator")
  .get(collectionController.getLatestCreator);  
router
  .route("/get-top-sellers")
  .get(collectionController.getTopSellers); 
router
  .route("/get-top-buyers")
  .get(collectionController.getTopBuyers);

module.exports = router;
