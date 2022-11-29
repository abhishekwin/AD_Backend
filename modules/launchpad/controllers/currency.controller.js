//const CurrencyTable = require('../models/currency.model')
const { LaunchPadCurrency } = require("../models");
const ResponseObject = require("../../../utils/ResponseObject");

const createCurrency = async (req, res) => {
    try {
        await LaunchPadCurrency.create(req.body)
        return res
            .status(200)
            .send(new ResponseObject(200, "Curreency details save Successfully", []));

    }
    catch (err) {
        console.log("error", err)
        return res
            .status(500)
            .send(new ResponseObject(500, "Something Went Wrong"));
    }
}

const getCurrency = async (req, res) => {
    try {
        const currencies = await LaunchPadCurrency.find()
        return res
            .status(200)
            .send(new ResponseObject(200, "Get all Curreency", currencies));
    }
    catch (error) {
        console.log("error", err)
        return res
            .status(500)
            .send(new ResponseObject(500, "Something Went Wrong"));
    }
}


module.exports = {
    createCurrency,
    getCurrency
};