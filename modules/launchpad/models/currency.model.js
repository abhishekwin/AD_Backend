const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const currencySchema = new mongoose.Schema(
    {
        currencyName: {
            type: String,
            trim: true,
            default: null,
            lowercase: true
        },
        currencyValue: {
            type: Number,
            default: null
        },
        currencyAddress: {
            type: String,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
)




const LaunchPadCurrency = mongoose.model("CurrencyTable", currencySchema)

module.exports = LaunchPadCurrency;