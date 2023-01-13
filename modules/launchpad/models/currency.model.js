const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const currencySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: null
        },
        brokerage: {
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
            default: null
        },
        network: {
            type: String,
            default: null
        },
        networkId: {
            type: Number,
            default: null
        },
        networkType: {
            type: String,
            default: null
        },
        position: {
            type: Number,
            default: null
        },
        slug: {
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