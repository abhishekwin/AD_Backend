const { fileUpload } = require("../models/fileUpload.model");

exports.uploadFile = async (req, res) => {
  try {
    const { files } = req.files;
    const result = await fileUpload(files, true);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      data: null,
      message: error.message,
      status: 400,
      success: false,
    });
  }
};
