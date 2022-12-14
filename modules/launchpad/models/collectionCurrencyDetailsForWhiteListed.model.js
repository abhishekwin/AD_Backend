const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const CurrencyDetailsForWhiteListedSchema = mongoose.Schema({
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
  }
});


CurrencyDetailsForWhiteListedSchema.set("toJSON", { getters: true, virtuals: true });
CurrencyDetailsForWhiteListedSchema.plugin(toJSON);
CurrencyDetailsForWhiteListedSchema.plugin(paginate);

const CurrencyDetailsForWhiteListed= mongoose.model(
  "LaunchPadCurrencyDetailsForWhiteListed",
  CurrencyDetailsForWhiteListedSchema
);


module.exports = CurrencyDetailsForWhiteListed;
