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
      default: null,
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
    tokenURI: {
      type: String,
      trim: true,
      default: null,
    },
    imageCover: {
      type: String,
      trim: true,
      default: null,
    },
    bannerImages: {
      type: String,
      trim: true,
      default: null,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    maxSupply: {
      type: Number,
      default: 0,
    },
    whitelistedFee: {
      type: Number,
      default: 0,
    },
    maximumQuantity: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    contactUri: {
      type: String,
      trim: true,
      default: null,
    },
    currency: {
      type: String,
      enum: ["ether", "bnb", "solana", "marsh"],
      default: "ether",
    },
    isWhiteListedUser: {
      type: Boolean,
      default: false,
    },
    isSale: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [null, "in-progress", "completed"],
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

collectionSchema.pre("save", async function (next) {
  const collection = this;
  if (collection.isModified("tokenURI")) {
    collection.tokenURI =
      "https://bleufi.mypinata.cloud/ipfs/" + collection.tokenURI;
  }
  next();
});
// add plugin that converts mongoose to json
collectionSchema.set("toJSON", { getters: true, virtuals: true });
collectionSchema.plugin(toJSON);
collectionSchema.plugin(paginate);

/**
 * @typedef Collection
 */
const Collection = mongoose.model("LaunchPadCollection", collectionSchema);

module.exports = Collection;
