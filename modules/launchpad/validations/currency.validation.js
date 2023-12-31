const Joi = require("joi");

const currencyValidation = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        //value: Joi.number().required(),
        brokerage: Joi.number().required(),
        address: Joi.string().required(),
        icon: Joi.string().required(),
        decimalValue: Joi.number().unsafe().required(),
        symbol: Joi.string().required(),
        network: Joi.string().required(),
        networkId: Joi.number().required(),
        //networkType: Joi.string().required(),
        position: Joi.number().required(),
        isActive: Joi.boolean(),
        //slug: Joi.string().required()
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
