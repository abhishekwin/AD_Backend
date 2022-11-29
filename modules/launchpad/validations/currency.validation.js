const Joi = require("joi");

const currencyValidation = {
    body: Joi.object().keys({
        currencyName: Joi.string().required(),
        currencyValue: Joi.number().required(),
        currencyAddress: Joi.string().required(),
        currencyIcon: Joi.string().required(),
        currencyDecimalValue: Joi.number().required(),
        isActive: Joi.boolean(),
    })
}

module.exports = {
    currencyValidation
};
