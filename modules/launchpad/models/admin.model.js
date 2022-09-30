const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const adminSettingSchema = mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      default: null,
      lowercase: true,
    },
    settingData: {
      type: Object,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// add plugin that converts mongoose to json
adminSettingSchema.set("toJSON", { getters: true, virtuals: true });
adminSettingSchema.plugin(toJSON);
adminSettingSchema.plugin(paginate);

/**
 * @typedef LaunchPadAdminSetting
 */
const LaunchPadAdminSetting = mongoose.model(
  "LaunchPadAdminSetting",
  adminSettingSchema
);

module.exports = LaunchPadAdminSetting;
