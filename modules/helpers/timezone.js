const moment = require('moment-timezone');
exports.date = moment.tz(Date.now(), "UTC");
 