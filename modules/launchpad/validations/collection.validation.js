const Joi = require('@hapi/joi');
const { objectId } = require('./custom.validation');

const addNotificationMessage = {
  body: Joi.object().keys({
    key: Joi.string().required(),
    value: Joi.string().required(),
  }),
};

const addAppMessage = {
  body: Joi.object().keys({
    key: Joi.string().required(),
    value: Joi.string().required(),
  }),
};

const addSuccessMessage = {
  body: Joi.object().keys({
    key: Joi.string().required(),
    value: Joi.string().required(),
  }),
};


module.exports = {
  addNotificationMessage,
  addAppMessage,
  addSuccessMessage
};
