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
    mintCost: Joi.number().optional(),
    royalties: Joi.number().strict().required(),
    imageCover: Joi.string().required(),
    bannerImages: Joi.string().required(),
    creator: Joi.string().required(),
    owner: Joi.string().required(),
    currency: Joi.string().optional(),
    whitelistedFee: Joi.number().optional(),
    whiteListedUser: Joi.when("isWhiteListedUser", {
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
    mintCountPerUser: Joi.number(),
    mintCountPerTransaction: Joi.number(),
    status: Joi.string().optional(),
    currencyDetails: Joi.array().optional(),
    phases:Joi.array().optional(),
  }),
};

const updateCollectionValidation = {
  body: Joi.object().keys({
    collectionId: Joi.string().required(),
    collectionAddress: Joi.string().required(),
  }),
};

const getStatsWithMultiFilter = {
  body: Joi.object().keys({
    networkId: Joi.string().valid("5", "97", ""),
    currency: Joi.string().valid("ETH", "BNB", "SAFEMOON", "DOGE", "USDC", "AD", ""),
    time: Joi.object().keys({
      from: Joi.number().required(),
      to: Joi.number().required()
    }).required()
    
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

const getBaseUri = {
  body: Joi.object().keys({
    networkId:Joi.number().required(),
    collectionAddress: Joi.string().required(),
  }),
};

const updateBaseUriFlag = {
  body: Joi.object().keys({
    networkId:Joi.number().required(),
    collectionAddress: Joi.string().required(),
  }),
};

const getPinataHash = {
  body: Joi.object().keys({
    uniqId:Joi.string().required(),
  }),
};

module.exports = {
  createCollectionValidation,
  updateCollectionValidation,
  topCreatorValidation,
  collectionCreatorUsersValidation,
  getStatsWithMultiFilter,
  getBaseUri,
  updateBaseUriFlag,
  getPinataHash
};
