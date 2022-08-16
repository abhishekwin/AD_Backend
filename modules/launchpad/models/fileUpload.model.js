const pinataSDK = require("@pinata/sdk");
const pinata = pinataSDK(
  process.env.PINATAAPIKEY,
  process.env.PINATAAPISECRETAPIKEY
);
const fs = require("fs");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);

const { IMAGE_URL } = process.env;

const uploadFileAtLocal = (uploadedFile, uploadPath) => {
  return new Promise((resolve, reject) => {
    return uploadedFile.mv(uploadPath, function (err) {
      if (err) {
        return reject(err);
      }
      return resolve("successfully uploaded");
    });
  });
};

const uploadFileAtPinata = async (file, localFileUnsync) => {
  try {
    const uploadpathurl = `/uploads/${new Date().getTime()}_${file.name}`;
    const uploadPath = `${appDir}/public${uploadpathurl}`;
    await uploadFileAtLocal(file, uploadPath);
    const readableStreamForFile = fs.createReadStream(uploadPath);
    const result = await pinata.pinFileToIPFS(readableStreamForFile);
    if (result && localFileUnsync) {
      fs.unlinkSync(uploadPath);
    }
    return `${IMAGE_URL}/${result.IpfsHash}`;
  } catch (err) {
    console.error(err);
    throw new Error("issue on uploading file");
  }
};

module.exports.fileUpload = async (files, localFileUnsync = false) => {
  try {
    if (!files) {
      throw new Error("file is required");
    }
    const images = [];
    if (Array.isArray(files) && files.length > 0) {
      for (file of files) {
        const uploadedUrl = await uploadFileAtPinata(file, localFileUnsync);
        images.push({ url: uploadedUrl });
      }
    } else if (typeof files === "object") {
      const uploadedUrl = await uploadFileAtPinata(files, localFileUnsync);
      images.push({ url: uploadedUrl });
    } else {
      throw new Error("File isn't valid");
    }
    return {
      data: images,
      status: 200,
      success: true,
      message: "File Uploaded successfully",
    };
  } catch (error) {
    return {
      data: null,
      message: error.message,
      status: 400,
      success: false,
    };
  }
};
