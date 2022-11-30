const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const currencySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: null,
            lowercase: true
        },
        value: {
            type: Number,
            default: null
        },
        address: {
            type: String,
            default: null
        },
        icon: {
            type: String,
            default: null
        },
        decimalValue: {
            type: Number,
            default: null
        },
        symbol: {
            type: String,
            default: null,
            uppercase: true
        },
        network: {
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