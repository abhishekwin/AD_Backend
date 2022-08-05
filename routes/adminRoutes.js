const express = require("express");
const router = express.Router();
const { checkAdminToken } = require("../middleware/auth");
const {
  approveCollectionController,
  deactivateNftsController,
  blockUserController,
  getCollectionAdminController,
  updateNftStatusController
} = require("../controllers");

/* update api's listing */
router.put("/approveCollections", checkAdminToken, approveCollectionController);
router.patch("/deactivateNfts", checkAdminToken, deactivateNftsController);
router.patch("/blockUser", checkAdminToken, blockUserController);

/* get api's listing */
router.get("/getCollectionList", checkAdminToken, getCollectionAdminController);

router.post("/updateNftStatus", checkAdminToken, updateNftStatusController);

module.exports = router;
