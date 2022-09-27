const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const coolTimeSchema = mongoose.Schema(
  {
    collectionAddress: {
      type: String,
      trim: true,
      default: null, 
    },
    userAddress: {
      type: String,
      trim: true,
      default: null,
    },
    mintTime: {
      type: Date,
      default: null,
    },
    currentMintTime: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// add plugin that converts mongoose to json
coolTimeSchema.set("toJSON", { getters: true, virtuals: true });
coolTimeSchema.plugin(toJSON);
coolTimeSchema.plugin(paginate);

/**
 * @typedef CoolTime
 */
const CoolTime = mongoose.model("CoolTime", coolTimeSchema);

module.exports = CoolTime;