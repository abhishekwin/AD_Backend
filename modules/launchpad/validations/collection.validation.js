const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createCollectionValidation = {
  body: Joi.object().keys({
    contractName: Joi.string().required(),
    collectionName: Joi.string().required(),
    symbol: Joi.string().required(),
    launchCollectionLater: Joi.boolean().strict().required(),
    tokenURI: Joi.string().required(),
    nftDescription: Joi.string().required(),
    maxSupply: Joi.number().strict().required(),
    mintCost: Joi.number().strict().required(),
    royalties: Joi.number().strict().required(),
    imageCover: Joi.string().required(),
    bannerImages: Joi.string().required(),
    isWhiteListedUser: Joi.boolean().strict().required(),
    creator: Joi.string().required(),
    owner: Joi.string().required(),
    currency: Joi.when("isWhiteListedUser", {
      is: true,
      then: Joi.string().required(),
    }),
    whitelistedFee: Joi.when("isWhiteListedUser", {
      is: true,
      then: Joi.number().required(),
    }),
    WhiteListedUser: Joi.when("isWhiteListedUser", {
      is: true,
      then: Joi.array().required(),
    }),
    startDate: Joi.when("isWhiteListedUser", {
      is: true,
      then: Joi.date().required(),
    }),
    endDate: Joi.when("isWhiteListedUser", {
      is: true,
      then: Joi.date().required(),
    }),
    networkId: Joi.number().optional(),
    networkName: Joi.string().optional(),
    currencyAddress: Joi.string().required(),
  }),
};

const updateCollectionValidation = {
  body: Joi.object().keys({
    collectionId: Joi.string().required(),
    collectionAddress: Joi.string().required(),
  }),
};

const topCreatorValidation = {
  body: Joi.object().keys({
    userAddresses: Joi.array().required(),
  }),
};

const collectionCreatorUsersValidation = {
  body: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required()
  }),
};

module.exports = {
  createCollectionValidation,
  updateCollectionValidation,
  topCreatorValidation,
  collectionCreatorUsersValidation,
};
