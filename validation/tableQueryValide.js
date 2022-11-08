const Joi = require("joi");
const { objectId } = require("../middleware/validate");

const tableQueryData = {
  body: Joi.object().keys({
    table: Joi.string()
      .valid(
        "collectionNFTs",
        "nfts",
        "users",
        "history",
        "userFollower",
        "nonce",
        "eventManager",
        "launchPadCollection",
        "launchpadhistories",
        "launchpadminthistories",
        "launchPadNft",
        "launchpadtopcreators",
        "launchPadMintHistory"
      )
      .required(),
    filter: Joi.object().optional(),
  }),
};

const tableQueryDataCount = {
  body: Joi.object().keys({
    table: Joi.string()
      .valid(
        "collectionNFTs",
        "nfts",
        "users",
        "history",
        "userFollower",
        "nonce",
        "eventManager",
        "launchPadCollection",
        "launchpadhistories",
        "launchpadminthistories",
        "launchPadNft",
        "launchpadtopcreators",
        "launchPadMintHistory"
      )
      .required(),
    filter: Joi.object().optional(),
  }),
};

module.exports = {
  tableQueryData,
  tableQueryDataCount
};
