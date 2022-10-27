const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const mintHistorySchema = mongoose.Schema(
  {
    collectionAddress: {
      type: String,
      trim: true,
      default: null, 
      lowercase: true
    },
    userAddress: {
        type: String,
        trim: true,
        default: null, 
        lowercase: true
      },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// add plugin that converts mongoose to json
mintHistorySchema.set("toJSON", { getters: true, virtuals: true });
mintHistorySchema.plugin(toJSON);
mintHistorySchema.plugin(paginate);

/**
 * @typedef LaunchPadMintHistory
 */
const LaunchPadMintHistory = mongoose.model("LaunchPadMintHistory", mintHistorySchema);

module.exports = LaunchPadMintHistory;