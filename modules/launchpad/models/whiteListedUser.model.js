const mongoose = require("mongoose");

const whiteListedUserSchema = mongoose.Schema(
  {
    collectionId: {
      type: String,
      require: true,
    },
    userAddress: {
      type: String,
      require: true,
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
