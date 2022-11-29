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

const removeCurrency = async (req, res) => {
    try {
        const id = req.query.id;
        const isCurrencyExist = await LaunchPadCurrency.findOne({ _id: id });

        if (!isCurrencyExist) {
            return res.status(400).send(new ResponseObject(400, "Invalid currency id "));
        }
        await LaunchPadCurrency.findByIdAndDelete({ _id: id });
        return res
            .status(200)
            .send(new ResponseObject(200, "Currency deleted sucessfully", isCurrencyExist));

    }
    catch (err) {
        console.log("error", err)
        return res
            .status(500)
            .send(new ResponseObject(500, "Something Went Wrong"));
    }
}

const updateCurrency = async (req, res) => {
    try {
        const { id } = req.query;

        const isCurrencyExist = await LaunchPadCurrency.findOne({ _id: id });

        if (!isCurrencyExist) {
            return res.status(400).send(new ResponseObject(400, "Invalid Currency id"));
        }

        const upadatedCurrency = await LaunchPadCurrency.findByIdAndUpdate({ _id: id }, req.body)
        return res
            .status(200)
            .send(new ResponseObject(200, "Currency updated sucessfully", upadatedCurrency))
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
    getCurrency,
    removeCurrency,
    updateCurrency
};