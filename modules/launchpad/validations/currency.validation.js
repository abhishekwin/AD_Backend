const Joi = require("joi");

const currencyValidation = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        value: Joi.number().required(),
        address: Joi.string().required(),
        icon: Joi.string().required(),
        decimalValue: Joi.number().required(),
        symbol: Joi.string().required(),
        network: Joi.string().required(),
        isActive: Joi.boolean(),
    })
}
const updateIsActiveValidation = {
    body: Joi.object().keys({
        isActive: Joi.boolean().required()
    })
}

module.exports = {
    currencyValidation,
    updateIsActiveValidation
};
