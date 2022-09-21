const Joi = require("joi");

const createWhiteListedValidation = {
  body: Joi.object().keys({
    nonce: Joi.number().required(),
    userAddress: Joi.string().required(),
    collectionId: Joi.string().required(),
    launchpadFactoryAddress: Joi.string().required(),
    collectionAddress: Joi.string().required(),
  }),
};

module.exports = {
    createWhiteListedValidation,
};
