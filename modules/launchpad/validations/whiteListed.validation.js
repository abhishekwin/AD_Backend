const Joi = require("joi");

const createWhiteListedValidation = {
  body: Joi.object().keys({
    collectionId: Joi.string().required(),
    networkId: Joi.number().required(),
    collectionAddress: Joi.string().required(),
    phase: Joi.number().allow(0).required(),
  }),
};

module.exports = {
    createWhiteListedValidation,
};
