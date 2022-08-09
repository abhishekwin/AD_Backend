const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createCollectionValidation = {
  body: Joi.object().keys({
    contractName: Joi.string().required(),
    collectionName: Joi.string().required(),
    symbol: Joi.string().required(),
    launchCollectionLater: Joi.boolean().strict().required(),
    addWhitelist: Joi.boolean().strict().required(),
    baseArtName: Joi.string().required(),
    nftDescription: Joi.string().required(),
    mintCost: Joi.number().strict().required(),
    royalties: Joi.number().strict().required(),
  }),
};


module.exports = {
  createCollectionValidation
};
