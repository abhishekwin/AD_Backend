const express = require("express");
// const auth = require('../../middlewares/auth');
const validate = require("../../../middleware/validate");
const {
  createCollectionValidation,
} = require("../validations/collection.validation");
// const manageMessageValidation = require('./validations/collection.validation');
const {createWhiteListUser} = require('../controllers/index')
const collectionController = require("../controllers/collection.controller");
//const secretkey = require('../../middlewares/secretkey');

const router = express.Router();

// For Notificcation
router
  .route("/create-collection")
  .post(validate(createCollectionValidation), collectionController.createCollection);

router
  .route("/create-whiteListedUser")
  .post( createWhiteListUser);

module.exports = router;
