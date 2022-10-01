const httpStatus = require("http-status");
const pick = require("../../comman/pick");
const jwt_decode = require("jwt-decode");
// const ApiError = require('../../../utils/ApiError');
// const catchAsync = require("../../../utils/catchAsync");
const ResponseObject = require("../../../utils/ResponseObject");
const { LaunchPadAdminSetting } = require("../models");

const createAdminSetting = async (req, res) => {
  try {
    const { type, settingData } = req.body;

    const findType = await LaunchPadAdminSetting.findOne({ type });
    if (findType) {
       findType.settingData = settingData;
      await findType.save();
    } else {
        await LaunchPadAdminSetting.create({
        type,
        settingData
      });
    }
    return res
      .status(200)
      .send(new ResponseObject(200, "Create Admin Setting Successfully", []));
  } catch (err) {
    console.log("error",err)
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

const getAdminSetting = async (req, res) => {
  try {
    const { type, settingData } = req.body;

    const adminSetting = await LaunchPadAdminSetting.find();
    
    return res
      .status(200)
      .send(new ResponseObject(200, "Create Admin Setting Successfully", adminSetting));
  } catch (err) {
    console.log("error",err)
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};
module.exports = {
  createAdminSetting,
  getAdminSetting
};
