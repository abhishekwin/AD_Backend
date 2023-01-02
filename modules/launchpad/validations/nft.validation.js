const Joi = require("joi");
const { objectId } = require("./custom.validation");

const getS3JsonFileValidation = {
  params: Joi.object().keys({
    fileName: Joi.string().required(),
    networkId: Joi.string().required(),
    collectionAddress: Joi.string().required()
  }),
};

module.exports = {
    getS3JsonFileValidation
};
