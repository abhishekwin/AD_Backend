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
        currencyIcon: {
            type: String,
            default: null
        },
        currencyDecimalValue: {
            type: Number,
            default: null
        },
        currencySymbol: {
            type: String,
            default: null,
            uppercase: true
        },
        currencyNetwork: {
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