const express = require("express");
// const auth = require('../../middlewares/auth');
const validate = require("../../../middleware/validate");
const {
  createCollectionValidation,
  updateCollectionValidation,
  topCreatorValidation,
  collectionCreatorUsersValidation,
  getStatsWithMultiFilter,
  getBaseUri,
  updateBaseUriFlag,
  getPinataHash
} = require("../validations/collection.validation");
const { createWhiteListedValidation } = require('../validations/whiteListed.validation')
// const manageMessageValidation = require('./validations/collection.validation');
const { checkAdminToken, checkToken } = require("../../middleware/auth");
const {
  createWhiteListUser,
  updateWhiteListUser,
  createSignature,
  uploadFile
} = require("../controllers/index");

const collectionController = require("../controllers/collection.controller");
//const secretkey = require('../../middlewares/secretkey');

const router = express.Router();

// For Notificcation
router
  .route("/create-collection")
  .post(
    checkToken,
    validate(createCollectionValidation),
    collectionController.createCollection
  );

router.route("/create-whiteListedUser").post( checkToken, createWhiteListUser);
router.route("/update-whiteListedUser").post( checkToken, updateWhiteListUser);
router.route("/create-signature").post(checkToken, validate( createWhiteListedValidation), createSignature);

router.route("/update-collection").patch(collectionController.updateCollection);

router.route("/update-collection-with-create-nft").patch(collectionController.updateCollectionWithCreateNft);

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
  .route("/upcoming-collection-list")
  .post(collectionController.upcomingCollectionList);

router
  .route("/live-collection-list")
  .post(collectionController.liveCollectionList);

router
  .route("/end-collection-list")
  .post(collectionController.endCollectionList);

router
  .route("/get-my-collection-list")
  .post(
    checkToken, 
    collectionController.getMyCollectionList
  );

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
  .route("/get-top-stats-collection-with-multi-filter")
  .post(validate(getStatsWithMultiFilter), collectionController.getStatsWithMultiFilter); 

router
  .route("/get-top-creator")
  .get(collectionController.topCreator); 
router
  .route("/get-latest-creator")
  .get(collectionController.getLatestCreator);  

router
  .route("/get-latest-collection")
  .post(collectionController.getLatestCollection);  

router
  .route("/get-top-sellers")
  .get(collectionController.getTopSellers); 
router
  .route("/get-top-buyers")
  .get(collectionController.getTopBuyers);
router
  .route("/get-collection-creator-users")
  .post(validate(collectionCreatorUsersValidation), collectionController.collectionCreatorUsers);
  
router
  .route("/add-top-creator")
  .post(checkAdminToken, validate(topCreatorValidation), collectionController.addTopCreator);

// router
//   .route("/create-static-collection")
//   .post(checkToken, collectionController.createStaticCollection);

// router
//   .route("/update-static-collection")
//   .post(checkToken, collectionController.updateStaticCollection);

  router
  .route("/get-user-latest-collection")
  .get(checkToken, collectionController.getUserLatestCollection);

  router
  .route("/get-collection-mint-count")
  .post(collectionController.getCollectionMintCount);
  
  router
  .route("/get-all-collection-for-admin")
  .post(checkAdminToken, collectionController.getAllCollectionForAdmin);

  router
  .route("/get-hide-collection")
  .post(checkAdminToken, collectionController.getHideCollection);

  router
  .route("/get-failed-collection")
  .post(checkAdminToken, collectionController.getFailedCollection);

  router
  .route("/hide-multipule-collection")
  .post(checkToken, checkAdminToken, collectionController.hideMultipuleCollection);

  router
  .route("/unhide-multipule-collection")
  .post(checkToken, checkAdminToken, collectionController.unHideMultipuleCollection);
  
  router
  .route("/get-base-uri")
  .post(checkToken, validate(getBaseUri), collectionController.getBaseUri);

  router
  .route("/update-base-uri-flag")
  .post(checkToken, validate(updateBaseUriFlag), collectionController.updateBaseUriFlag);

  router
  .route("/get-pinata-hash")
  .post(checkToken, validate(getPinataHash), collectionController.getPinataHash);


module.exports = router;
