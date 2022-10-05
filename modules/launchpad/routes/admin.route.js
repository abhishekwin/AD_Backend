const express = require("express");
const router = express.Router();
const validate = require("../../../middleware/validate");
const { checkAdminToken } = require("../../middleware/auth");
const { adminSettingValidation } = require("../validations/launchpadAdmin.validation")
const { createAdminSetting, getAdminSetting } = require("../controllers/")

router
  .route("/launchpad-admin-setting")
  .post(
    checkAdminToken,
    validate(adminSettingValidation),
    createAdminSetting
  );


  router
  .route("/get-launchpad-admin-setting")
  .get(
    checkAdminToken,
    getAdminSetting
  );

module.exports = router;