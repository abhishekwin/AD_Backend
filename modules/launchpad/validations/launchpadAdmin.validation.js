const Joi = require("joi");
const { objectId } = require("./custom.validation");

const adminSettingValidation = {
  body: Joi.object().keys({
    type: Joi.string().required(),
    settingData: Joi.object({
      coolTime: Joi.number().required(),
      coolTimeType: Joi.string().required()
   }).required(),
  }),
};

module.exports = {
  adminSettingValidation,
};