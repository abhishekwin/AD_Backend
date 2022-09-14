const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const { number } = require("@hapi/joi");

const nftSchema = mongoose.Schema(
  {
    id: {
      type: String,
      generated: true,
      trim: true,
    },
    collectionId: {
      type: String,
      trim: true,
      default: null,
    },
    collectionAddress: {
      type: String,
      trim: true,
      default: null,
    },
    mintCost: {
      type: Number,
      trim: true,
      default: null,
    },
    royalties: {
      type: Number,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      trim: true,
      default: null, //active
    },
    isSale: {
      type: Boolean,
      trim: true,
      default: false,
    },
    isFirstSale: {
      type: Boolean,
      trim: true,
      default: false,
    },
    tokenId: {
      type: String,
      trim: true,
      default: null,
    },
    tokenURI: {
      type: String,
      trim: true,
      default: null,
    },
    ownerAvatar: {
      type: String,
      trim: true,
      default: null,
    },
    owner: {
      type: String,
      trim: true,
      default: null,
    },
    creator: {
      type: String,
      trim: true,
      default: null,
    },
    price: {
      type: Number,
      default: 0,
    },
    paymentType: {
      type: String,
      enum: ["BNB","ETH"],
      default: "BNB",
    },
    saleType: {
      type: String,
      default: "Fixed",
    },
    time: {
      type: String,
      default: null,
    },
    likes: {
      type: Array,
      default: null,
    },
    created: {
      type: Date,
      default: null,
    },
    type: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    signature: {
      type: String,
      default: null,
    },
    nonce: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
    awsImage: {
      type: Object,
      default: null,
    },
    compiler: {
      type: String,
      default: null,
    },
    crontype: {
      type: String,
      default: null,
    },
    isMoralisesNft: {
      type: Boolean,
      default: false,
    },
    awsImagesUpdated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// add plugin that converts mongoose to json
nftSchema.set("toJSON", { getters: true, virtuals: true });
nftSchema.plugin(toJSON);
nftSchema.plugin(paginate);

/**
 * @typedef LaunchPadNft
 */
const LaunchPadNft = mongoose.model("LaunchPadNft", nftSchema);

module.exports = LaunchPadNft;
