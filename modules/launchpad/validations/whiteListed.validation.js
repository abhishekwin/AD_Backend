const Joi = require("joi");

const createWhiteListedValidation = {
  body: Joi.object().keys({
    collectionId: Joi.string().required(),
    launchpadFactoryAddress: Joi.string().required(),
    collectionAddress: Joi.string().required(),
  }),
};

module.exports = {
    createWhiteListedValidation,
};
