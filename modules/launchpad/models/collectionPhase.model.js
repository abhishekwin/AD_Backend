const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const collectionPhaseSchema = mongoose.Schema(
  {
    id: {
      type: String,
      generated: true,
      trim: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
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
    // currencyDetails:[CurrencyDetailsSchema],
    // currencyDetailsForWhiteListed: [CurrencyDetailsForWhiteListedSchema],
    isWhiteListedUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


collectionPhaseSchema.set("toJSON", { getters: true, virtuals: true });
collectionPhaseSchema.plugin(toJSON);
collectionPhaseSchema.plugin(paginate);

// const CollectionCurrencyDetails = mongoose.model(
//   "LaunchPadCollectionCurrencyDetails",
//   CurrencyDetailsSchema
// );

// const CurrencyDetailsForWhiteListed= mongoose.model(
//   "LaunchPadCurrencyDetailsForWhiteListed",
//   CurrencyDetailsForWhiteListedSchema
// );

const CollectionPhase = mongoose.model(
  "LaunchPadCollectionPhase",
  collectionPhaseSchema
);

module.exports = CollectionPhase;
// module.exports = CollectionCurrencyDetails;
// module.exports = CurrencyDetailsForWhiteListed;
