const { fileUpload } = require("../../comman/fileUpload");
const { dirname } = require('path');
const appDir = dirname(require.main.filename);
const fs = require('fs');

exports.uploadFile = async (req, res) => {
  try {
    const { files } = req.files;
    const publicdir = appDir+'/public';
    if (!fs.existsSync(publicdir)) {
      fs.mkdirSync(publicdir, 0744);                  
    }
    const uploaddir = appDir+ '/public/uploads';
  if(!fs.existsSync(uploaddir)){
    fs.mkdirSync(uploaddir, 0744);
  }
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
