const express = require('express');
const collectionRoute = require('../modules/launchpad/routes/collection.route')
const router = express.Router();
router.use('/collection', collectionRoute);

module.exports = router;