const express = require("express");
const router = express.Router();
const validate = require("../../../middleware/validate");
const { checkAdminToken } = require("../../middleware/auth");
const { adminSettingValidation } = require("../validations/launchpadAdmin.validation")
const { createAdminSetting } = require("../controllers/")

router
  .route("/launchpad-admin-setting")
  .post(
    // checkAdminToken,
    validate(adminSettingValidation),
    createAdminSetting
  );


module.exports = router;