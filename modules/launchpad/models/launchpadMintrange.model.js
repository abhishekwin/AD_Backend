const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const mintRangeSchema = mongoose.Schema(
  {
    collectionAddress: {
      type: String,
      trim: true,
      default: null, 
      lowercase: true
    },
    startRange: {
      type: Number,
      trim: true,
      default: 0
    },
    endRange: {
      type: Number,
      trim: true,
      default: 0
    },
    mintCurrency: {
      type: String,
      trim: true,
      default: null
    },
    networkId: {
      type: Number,
      trim: true,
      default: null
    },
    epochTime: {
      type: Number,
      trim: true,
      default: null
    },
    subgraphMintId: {
      type: String,
      trim: true,
      default: null
    },
    mintFee: {
      type: String,
      trim: true,
      default: null
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// add plugin that converts mongoose to json
mintRangeSchema.set("toJSON", { getters: true, virtuals: true });
mintRangeSchema.plugin(toJSON);
mintRangeSchema.plugin(paginate);

/**
 * @typedef LaunchPadMintRangeHistory
 */
const LaunchPadMintRangeHistory = mongoose.model("LaunchpadMintRange", mintRangeSchema);

module.exports = LaunchPadMintRangeHistory;