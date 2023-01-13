const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const CurrencyDetailsSchema = mongoose.Schema({
  id: {
    type: String,
    generated: true,
    trim: true,
  },
  phaseId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
  },
  currency: {
    type: String,
    default:null
  },
  mintCost: {
    type: Number,
    default:0
  },
  icon: {
    type: String,
    default:null
  },
  address: {
    type: String,
    default:null
  },
  symbol: {
    type: String,
    default:null
  },
  decimalValue: {
    type: Number,
    default:0
  }
});


CurrencyDetailsSchema.set("toJSON", { getters: true, virtuals: true });
CurrencyDetailsSchema.plugin(toJSON);
CurrencyDetailsSchema.plugin(paginate);

const CollectionCurrencyDetails = mongoose.model(
  "LaunchPadCollectionCurrencyDetails",
  CurrencyDetailsSchema
);

module.exports = CollectionCurrencyDetails;
