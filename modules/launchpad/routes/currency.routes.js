const express = require("express");
const router = express.Router();
const { createCurrency, getCurrency } = require("../controllers/index");
const validate = require("../../../middleware/validate");
const { currencyValidation } = require("../validations/currency.validation")

router.post('/createCurrency', validate(currencyValidation), createCurrency)
router.get("/getCurrencies", getCurrency)


module.exports = router;
