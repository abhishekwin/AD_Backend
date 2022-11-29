const Joi = require("joi");

const currencyValidation = {
    body: Joi.object().keys({
        currencyName: Joi.string().required(),
        currencyValue: Joi.number().required(),
        currencyAddress: Joi.string().required(),
        isActive: Joi.boolean(),
    })
}

module.exports = {
    currencyValidation
};
