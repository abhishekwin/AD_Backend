const express = require("express");
const router = express.Router();
const validate =  require('../middleware/validate')
const tableQuery = require('../validation/tableQueryValide')

const { checkTableQueryData } = require("../controllers");

router.post("/tableQueryData", validate(tableQuery.tableQueryData), checkTableQueryData);

module.exports = router;
