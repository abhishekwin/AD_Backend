const pinataSDK = require("@pinata/sdk");
const pinata = pinataSDK(
  process.env.PINATAAPIKEY,
  process.env.PINATAAPISECRETAPIKEY
);
const fs = require("fs");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);

const IMAGE_URL = process.env.PINTA_IMAGE_DOMAIN;
const appRoot = require('app-root-path');
const path = require('path');
const {uploadDir} = require("./pinata");

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

const uploadFileToPinata = async (file) => {
  const readableStreamForFile = fs.createReadStream(file.path);
  // console.log("readableStreamForFile", readableStreamForFile)
  return new Promise((resolve, reject) => {
      pinata.pinFileToIPFS(readableStreamForFile).then((result) => {
          resolve(result);
      }).catch((err) => {
          //handle error here
          reject(err);
      });
  })  
};

const fileUpload = async (files, localFileUnsync = false) => {
  try {
    if (!files) {
      throw new Error("file is required");
    }
    const images = [];
    if (Array.isArray(files) && files.length > 0) {
      for (let file of files) {
        const uploadedUrl = await uploadFileToPinata(file);
        if(uploadedUrl){
          images.push({ url: "https://bleufi.mypinata.cloud/ipfs/"+uploadedUrl.IpfsHash });
        }
      }
    } else {
      throw new Error("File isn't valid");
    }
    return images
  } catch (error) {
    console.log("pinata upload error", error)
  }
};

async function uploadMultiJsonData (filedatas) { 
  try{
    let count = 1
    let randomNum = (Math.random() + 1).toString(36).substring(7);
    fs.mkdir(path.join('./public/', randomNum), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log('Directory created successfully!');
    });
    
    let folderPath = appRoot.path+`/public/${randomNum}`;
    for (const data of filedatas) {
      let fileUploadPath = `./public/${randomNum}/` + count + '.json';
      fs.writeFile(fileUploadPath, JSON.stringify(data), function (err) {
      });
      count++;
    }    
    let result = await uploadDir(folderPath)   
    fs.rmSync(folderPath, { recursive: true, force: true });
    return result;
  }catch(error){
    console.error("error.message", error)
  }   
}

module.exports = {
  fileUpload,
  uploadMultiJsonData
}