const Joi = require("joi");
const { objectId } = require("./custom.validation");

const getS3JsonFileValidation = {
  body: Joi.object().keys({
    tokenId: Joi.string().required(),
    collectionId: Joi.string().required()
  }),
};

module.exports = {
    getS3JsonFileValidation
};
