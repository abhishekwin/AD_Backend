const mongoose = require("mongoose");

const whiteListedUserSchema = mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
    },
    phaseId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
    },
    userAddress: {
      type: String,
      require: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

const WhiteListedUser = mongoose.model(
  "WhiteListedUser",
  whiteListedUserSchema
);

module.exports = WhiteListedUser;
