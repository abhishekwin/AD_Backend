const mongoose = require("mongoose");

const collectionPhaseSchema = mongoose.Schema(
  {
    id: {
      type: String,
      generated: true,
      trim: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.String,
      require: true,
    },

    phase: {
      type: Number,
      require: true,
    },
    startTime: {
      type: Date,
      require: true,
      lowercase: true,
    },
    endTime: {
      type: Date,
      require: true,
      lowercase: true,
    },

    mintCountPerUser: {
      type: Number,
      trim: true,
      default: 0,
    },
    mintCountPerTransaction: {
      type: Number,
      trim: true,
      default: 0,
    },

    currencyDetails: {
      type: Array,
      default: null,
    },
    currencyDetailsForWhiteListed: {
      type: Array,
      default: null,
    },

    whiteListStartTime: {
      type: Date,

      lowercase: true,
    },
    whiteListEndTime: {
      type: Date,

      lowercase: true,
    },

    isWhiteListedUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const CollectionPhase = mongoose.model(
  "CollectionPhase",
  collectionPhaseSchema
);

module.exports = CollectionPhase;
