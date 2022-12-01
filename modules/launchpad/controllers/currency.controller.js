//const CurrencyTable = require('../models/currency.model')
const { LaunchPadCurrency } = require("../models");
const ResponseObject = require("../../../utils/ResponseObject");
const { uploadSingleFile } = require('../../../utils/s3Upload')
const uniqid = require('uniqid');

const createCurrency = async (req, res) => {
    try {
        const newCurrency = await LaunchPadCurrency.create(req.body)
        return res
            .status(200)
            .send(new ResponseObject(200, "Curreency details save Successfully", newCurrency));

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
        const currencies = await LaunchPadCurrency.find().sort({ position: 1 })
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
        const { id } = req.params;
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
        const { id } = req.params;

        const isCurrencyExist = await LaunchPadCurrency.findOne({ _id: id });

        if (!isCurrencyExist) {
            return res.status(400).send(new ResponseObject(400, "Invalid Currency id"));
        }

        const upadatedCurrency = await LaunchPadCurrency.findByIdAndUpdate({ _id: id }, req.body)
        return res
            .status(200)
            .send(new ResponseObject(200, "Currency updated sucessfully", upadatedCurrency))
    }
    catch (err) {
        console.log("error", err)
        return res
            .status(500)
            .send(new ResponseObject(500, "Something Went Wrong"));
    }
}
const updateIsActiveCurrency = async (req, res) => {
    try {
        const { id } = req.params;
        const isCurrencyExist = await LaunchPadCurrency.findOne({ _id: id });

        if (!isCurrencyExist) {
            return res.status(400).send(new ResponseObject(400, "Invalid Currency id"));
        }
        const upadatedIsActiveCurrency = await LaunchPadCurrency.findByIdAndUpdate({ _id: id }, req.body)
        return res
            .status(200)
            .send(new ResponseObject(200, "Currency updated sucessfully", upadatedIsActiveCurrency))

    }
    catch (err) {
        onsole.log("error", err)
        return res
            .status(500)
            .send(new ResponseObject(500, "Something Went Wrong"));
    }
}

const uploadCurrencyIcon = async (req, res) => {
    try {
        let filePathUrl = req.file.path;
        let folderName = "currency-icon";
        let fileName = uniqid() + req.file.filename
        let result = await uploadSingleFile(filePathUrl, folderName, fileName);
        result = process.env.AWS_CDN_URL + result
        return res
            .status(200)
            .send(new ResponseObject(200, "Icon uploaded successfully", result))
    } catch (error) {
        return res.status(400).json({
            data: null,
            error: error.message,
            status: 400,
            success: false,
        });
    }
}
module.exports = {
    createCurrency,
    getCurrency,
    removeCurrency,
    updateCurrency,
    updateIsActiveCurrency,
    uploadCurrencyIcon
};