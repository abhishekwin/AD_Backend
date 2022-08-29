const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const { number } = require("@hapi/joi");

const collectionSchema = mongoose.Schema(
  {
    id: {
      type: String,
      generated: true,
      trim: true,
    },
    collectionAddress: {
      type: String,
      trim: true,
      default: null,
    },
    contractName: {
      type: String,
      trim: true,
      default: null,
    },
    collectionName: {
      type: String,
      trim: true,
      default: null,
    },
    symbol: {
      type: String,
      trim: true,
      default: null,
    },
    launchCollectionLater: {
      type: Boolean,
      trim: true,
      default: null,
    },
    addWhitelist: {
      type: Boolean,
      trim: true,
      default: null,
    },
    baseArtName: {
      type: String,
      trim: true,
      default: null,
    },
    nftDescription: {
      type: String,
      trim: true,
      default: null,x
    },
    mintCost: {
      type: Number,
      trim: true,
      default: 0,
    },
    royalties: {
      type: Number,
      trim: true,
      default: 0,
    },
    pinataHash: {
      type: String,
      trim: true,
      default: null,
    },
    imageCover: {
      type: String,
      trim: true,
      default:null
    },
    bannerImages: {
      type: String,
      trim: true,
      default:null
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// add plugin that converts mongoose to json
collectionSchema.set("toJSON", { getters: true, virtuals: true });
collectionSchema.plugin(toJSON);
collectionSchema.plugin(paginate);


/**
 * @typedef Collection
 */
const Collection = mongoose.model("LaunchPadCollection", collectionSchema);

module.exports = Collection;
