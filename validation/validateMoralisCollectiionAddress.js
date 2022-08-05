const Joi = require("joi");
const { objectId } = require("../middleware/validate");

const collectionAddress = {
  body: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
    collectionAddress: Joi.string().required(),
    owner: Joi.string(),
    links: Joi.string().optional(),
    creator: Joi.string(),
    imageCover: Joi.string(),
    bannerImages: Joi.string(),
  }),
};

module.exports = {
  collectionAddress,
};
