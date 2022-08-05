const express = require('express');
// const auth = require('../../middlewares/auth');
// const validate = require('../../middlewares/validate');
// const manageMessageValidation = require('./validations/collection.validation');
const collectionController = require('./controllers/collection.controller');
//const secretkey = require('../../middlewares/secretkey');

const router = express.Router();

// For Notificcation
router
  .route('/create-collection')
  .post(collectionController.createCollection);

module.exports = router;
