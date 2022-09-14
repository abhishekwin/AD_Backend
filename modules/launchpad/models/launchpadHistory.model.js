const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const historySchema = mongoose.Schema(
  {
    userId: {
      type: String,
      trim: true,
      default: null,
    },
    oldUserId: {
      type: String,
      trim: true,
      default: null,
    },
    nftId: {
      type: String,
      trim: true,
      default: null,
    },
    paymentType: {
      type: String,
      trim: true,
      default: null,
    },
    time: {
      type: String,
      trim: true,
      default: null,
    },
    cronType: {
      type: String,
      trim: true,
      default: null,
    },
    eventType: {
      type: String,
      trim: true,
      default: null,
    },
    subGraphId: {
      type: String,
      trim: true,
      default: null,
    },
    actionType: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
    epochTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
// add plugin that converts mongoose to json
historySchema.set("toJSON", { getters: true, virtuals: true });
historySchema.plugin(toJSON);
historySchema.plugin(paginate);

/**
 * @typedef LaunchPadHistory
 */
const LaunchPadHistory = mongoose.model("LaunchPadHistory", historySchema);

module.exports = LaunchPadHistory;
