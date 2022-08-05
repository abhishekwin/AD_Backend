const httpStatus = require('http-status');

class ResponseObject {
  /**
   *Creates an instance of ResponseObject.
   * @param {*} statusCode
   * @param {*} data
   * @memberof ResponseObject
   * @returns {object}
   */
  constructor(statusCode, msg, data) {
    this.Error = false;
    this.Success = false;

    this.data = data;
    this.msg = msg;

    if ((statusCode === 200) || (statusCode === 201)) {
      this.Success = {
        code: statusCode,
        type: httpStatus[statusCode],
        message: this.msg,
        data: this.data
      };
    } else {
      this.Error = {
        code: statusCode,
        type: httpStatus[statusCode],
        message: this.msg
      };
    }

    this.responseObject = {
      error: this.Error,
      success: this.Success
    };

    return this.responseObject;
  }
}

module.exports = ResponseObject;
