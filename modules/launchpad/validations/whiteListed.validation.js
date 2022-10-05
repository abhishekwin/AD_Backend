const Joi = require("joi");

const createWhiteListedValidation = {
  body: Joi.object().keys({
    collectionId: Joi.string().required(),
    networkId: Joi.number().required(),
    collectionAddress: Joi.string().required(),
  }),
};

module.exports = {
    createWhiteListedValidation,
};
