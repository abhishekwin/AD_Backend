const express = require("express");
const router = express.Router();
const validate =  require('../middleware/validate')
const tableQuery = require('../validation/tableQueryValide')

const { checkTableQueryData, checkTableQueryDataCount } = require("../controllers");

router.post("/tableQueryData", validate(tableQuery.tableQueryData), checkTableQueryData);

router.post("/tableQueryDataCount", validate(tableQuery.tableQueryDataCount), checkTableQueryDataCount);

module.exports = router;
