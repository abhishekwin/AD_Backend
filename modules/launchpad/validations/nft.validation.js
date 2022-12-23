const Joi = require("joi");
const { objectId } = require("./custom.validation");

const getS3JsonFileValidation = {
  query: Joi.object().keys({
    tokenId: Joi.string().required(),
    networkId: Joi.string().required(),
    collectionAddress: Joi.string().required()
  }),
};

module.exports = {
    getS3JsonFileValidation
};
