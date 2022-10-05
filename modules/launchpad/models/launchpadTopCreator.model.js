const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const topCreatorSchema = mongoose.Schema(
  {
    userAccountAddress: {
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
topCreatorSchema.set("toJSON", { getters: true, virtuals: true });
topCreatorSchema.plugin(toJSON);
topCreatorSchema.plugin(paginate);

/**
 * @typedef LaunchPadTopCreator
 */
const LaunchPadTopCreator = mongoose.model("LaunchPadTopCreator", topCreatorSchema);

module.exports = LaunchPadTopCreator;