const express = require("express");
const router = express.Router();
const { createCurrency, getCurrency, removeCurrency, updateCurrency, updateIsActiveCurrency } = require("../controllers/index");
const validate = require("../../../middleware/validate");
const { currencyValidation, updateIsActiveValidation } = require("../validations/currency.validation")

router.post('/createCurrency', validate(currencyValidation), createCurrency)
router.get("/getCurrencies", getCurrency)
router.delete('/removeCurrency/:id', removeCurrency)
router.put('/updateCurrency/:id', validate(currencyValidation), updateCurrency)
router.patch('/updateIsActiveCurrency/:id', validate(updateIsActiveValidation), updateIsActiveCurrency)

module.exports = router;
