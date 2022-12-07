const express = require("express");
const router = express.Router();
const multer = require("multer");
const { dirname } = require("path");
const { checkAdminToken } = require("../../middleware/auth");
const appDir = dirname(require.main.filename);
const fs = require("fs")
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploaddir = appDir + '/public/currency-icon';
    if (!fs.existsSync(uploaddir)) {
      fs.mkdirSync(uploaddir, 0744);
    }
    cb(null, "public/currency-icon")
  },
  filename: function (req, file, cb) { cb(null, file.originalname) }
})
const upload = multer({ storage })

const { createCurrency, getCurrency, removeCurrency, updateCurrency, updateIsActiveCurrency, uploadCurrencyIcon, getCurrencyDetails, getCurrencyWithFilter } = require("../controllers/index");
const validate = require("../../../middleware/validate");
const { currencyValidation, updateIsActiveValidation } = require("../validations/currency.validation")

router.post('/createCurrency', checkAdminToken, validate(currencyValidation), createCurrency)
router.get("/getCurrencies", getCurrency)
router.delete('/removeCurrency/:id', removeCurrency)
router.put('/updateCurrency/:id', checkAdminToken, validate(currencyValidation), updateCurrency)
router.patch('/updateIsActiveCurrency/:id', checkAdminToken,  validate(updateIsActiveValidation), updateIsActiveCurrency)
router.post('/uploadCurrencyIcon', checkAdminToken, upload.single("icon"), uploadCurrencyIcon);
router.post("/getCurrencyDetail", getCurrencyDetails)
router.post("/getCurrencyWithFilter", getCurrencyWithFilter)
module.exports = router;
