const Joi = require("joi");

const currencyValidation = {
    body: Joi.object().keys({
        currencyName: Joi.string().required(),
        currencyValue: Joi.number().required(),
        currencyAddress: Joi.string().required(),
        currencyIcon: Joi.string().required(),
        currencyDecimalValue: Joi.number().required(),
        currencySymbol: Joi.string().required(),
        currencyNetwork: Joi.string().required(),
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
