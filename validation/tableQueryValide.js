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
        "nonce"
      )
      .required(),
    filter: Joi.object().optional(),
  }),
};

module.exports = {
  tableQueryData,
};
