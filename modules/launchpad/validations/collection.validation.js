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
    imageCover: Joi.string().required(),
    bannerImages: Joi.string().required(),
  }),
};

const updateCollectionValidation = {
  body: Joi.object().keys({
    collectionId: Joi.string().required(),
    collectionAddress: Joi.string().required()
  }),
};

module.exports = {
  createCollectionValidation,
  updateCollectionValidation
};
