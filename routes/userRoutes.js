const express = require("express");
const { checkToken } = require("../middleware/auth");
const router = express.Router();
const {
  saveNftsController,
  getNftListController,
  getTopCollectionController,
  getCreatorListController,
  getCreatorListControllerV2,
  getCollectionListController,
  saveCollectionController,
  getNftsByIdController,
  createProfileController,
  getTotalNoOfFollowers,
  getProfileByIdController,
  addFollowerController,
  unFollowController,
  followUnfollowController,
  updateProfileController,
  getTopCreatorController,
  getProfileByAccountController,
  getNonceController,
  getCountNonceController,
  createNftItemController,
  verifySignatureController,
  likeDislikeController,
  updateNftsController,
  fetchOtherNftsController,
  updateUserFollower,
  getBlockedListedNfts,
  updatedNftPutOffSale,
  saveCollectionWithCollectionAddress,
  getMyCollectionListController,
  getCollectionHeaders
} = require("../controllers");
const validate =  require('../middleware/validate')
const moralis = require('../validation/validateMoralisCollectiionAddress')
/* Create Api Listing */
router.post("/createNfts", saveNftsController); //One for backend developer
router.post("/createCollection", saveCollectionController);
router.post("/createProfile", checkToken, createProfileController);
router.post("/getNonceCode", getNonceController);
router.post("/createNftItem/:nonceId", checkToken, createNftItemController);
router.post("/verifySignature", verifySignatureController);
router.post("/fetchOtherNfts", fetchOtherNftsController);

/* GET Api listing. */
router.get("/getNftList", getNftListController);
router.get("/getTopCollections", getTopCollectionController);

// Update api
router.get("/getCreator", getCreatorListController);
router.post("/getCreator/v2", getCreatorListControllerV2);

router.get("/getTopCreator", getTopCreatorController);
router.get("/getCollections", getCollectionListController);
router.get("/getNft/:collectionAddress/:id", getNftsByIdController);
router.get("/getFollowers/:userId", getTotalNoOfFollowers);
router.get("/getProfile/:userId", getProfileByIdController);
router.get("/getProfileByaccount/:accountId", getProfileByAccountController);
router.get("/getCountOfNonce", getCountNonceController);

/* Update Api listing */
router.patch("/addFollower/:userId/:followerId", checkToken, addFollowerController);
router.patch("/unfollow/:userId/:followerId", checkToken, unFollowController);

router.post("/follow-unfollow", checkToken, followUnfollowController)

router.patch("/updateProfile", checkToken, updateProfileController);

router.patch("/like_dislike/:nftId", checkToken, likeDislikeController);
router.patch("/updatedNfts/:nftId", checkToken, updateNftsController);
router.post('/updateUserFollower', updateUserFollower);

//new 
router.get("/getBlockedListedNfts", checkToken, getBlockedListedNfts)
router.post("/updatedNftPutOffSale",  checkToken,  updatedNftPutOffSale);
router.post("/createCollectionWithCollectionAddress", validate(moralis.collectionAddress), saveCollectionWithCollectionAddress);
router.post("/getMyCollections", checkToken, getMyCollectionListController);
router.post("/getCollectionsHeadersValue", getCollectionHeaders);

module.exports = router;
