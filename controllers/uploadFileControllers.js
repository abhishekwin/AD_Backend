const { CollectionNFTs, Users, Nfts, Nonce, History } = require("../models");
const helpers = require("../helpers/helper");
const jwt = require("jsonwebtoken");
const Web3 = require("web3");
let WEB3_URL = process.env.WEB3_URL;
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL;
const specialCharacter = require("../helpers/RegexHelper");
const jwt_decode = require("jwt-decode");
const pinataSDK = require("@pinata/sdk");
const path = require("path");
const _ = require('lodash');
const uniqid = require('uniqid'); 

const pinata = pinataSDK(
  process.env.PINATAAPIKEY,
  process.env.PINATAAPISECRETAPIKEY
);
const fs = require("fs");
const fsPromises = require('fs').promises; 
const { uploadDir } = require("../services/pinata");
const {uploadDirToS3} = require("../utils/s3UploadDir");
const getjson = (file) => {
  const readableStreamForFile = fs.createReadStream(file.path);
  const jsonString = fs.readFileSync("./public/files/" + file.originalname);
  const jsondata = JSON.parse(jsonString);
  return jsondata;
};
const appRoot = require("app-root-path");
const { ProcessCredentials } = require("aws-sdk");

function sleep() {
  return new Promise((resolve) => {
    setTimeout(resolve, 100000);
  });
}

async function uploadFileInPublicFolder(filedatas) {
  let count = 1;
  let randomNum = uniqid();
  fs.mkdir(path.join("./public/", randomNum), (err) => {
    if (err) {
      return console.error(err);
    }
    console.log("Directory created successfully!");
  });

  let folderPath = appRoot.path + `/public/${randomNum}`;
  for (const data of filedatas) {
    let fileUploadPath = `./public/${randomNum}/` + count + ".json";
    let content = JSON.stringify(data)       
    fsPromises.writeFile(fileUploadPath, content, function (err) {});
    count++;
  }  
  return {folderPath, count:count-1, folderName:randomNum}
}

module.exports = {
  uploadFile: async (req, res) => {
    try {
      console.log(req.file.path)
      const readableStreamForFile = fs.createReadStream(req.file.path);
      const filename = __dirname + req.file.originalname;
      pinata
        .pinFileToIPFS(readableStreamForFile)
        .then((result) => {
          if (result) {
            // fs.unlink(req.file.path, function () {
            //   //fs.rmdir('node');
            // });
            result.url =
              "https://bleufi.mypinata.cloud/ipfs/" + result.IpfsHash;
            return res.status(200).json({
              data: result,
              status: 200,
              success: true,
              message: "url sen",
            });
          } else {
            return res.status(400).json({
              data: null,
              error: "Not Upload",
              status: 400,
              success: false,
            });
          }
        })
        .catch((err) => {
          return res.status(400).json({
            data: null,
            error: "Not Upload",
            status: 400,
            success: false,
          });
        });
    } catch (error) {
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
  uploadJson: async (req, res) => {
    try {
      // const readableStreamForFile = fs.createReadStream(req.file.path);
      // const filename = __dirname+req.file.originalname;
      const body = req.body ? req.body : {};
      pinata
        .pinJSONToIPFS(body)
        .then((result) => {
          if (result) {
            result.url =
              "https://bleufi.mypinata.cloud/ipfs/" + result.IpfsHash;
            return res.status(200).json({
              data: result,
              status: 200,
              success: true,
              message: "url sen",
            });
          } else {
            return res.status(400).json({
              data: null,
              error: "Not Upload",
              status: 400,
              success: false,
            });
          }
        })
        .catch((err) => {
          return res.status(400).json({
            data: null,
            error: "Not Upload",
            status: 400,
            success: false,
          });
        });
    } catch (error) {
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
  uploadMultiJsonData: async (req, res) => {
    try {      
      let filedatas = getjson(req.file);
      filedatas = await helpers.shuffle(filedatas);
      let uploadedData = await uploadFileInPublicFolder(filedatas)
      if(uploadedData){
        if(uploadedData.count == filedatas.length){
          const folderPath = uploadedData.folderPath;
          const folderName = uploadedData.folderName          
          let result = await uploadDir(folderPath);
          // let s3UploadDirResult = await uploadDirToS3(folderPath, folderName)
          result.s3BucketUrl =   "collection-nfts/" +folderName
          fs.rmSync(folderPath, { recursive: true, force: true });
          fs.rmSync(appRoot.path + "/" + req.file.path, {
            recursive: true,
            force: true,
          });
          return res.status(200).json({
            data: result,
            status: 200,
            success: true,
            message: "Url sent",
          });       
        }else{
          return res.status(400).send({
            error: true,
            status: 400,
            success: false,
            message: "Failed To upload json",
          });
        }
      }else{
        return res.status(400).send({
          error: true,
          status: 400,
          success: false,
          message: "Failed To upload json",
        });
      }     
    } catch (error) {
      console.error("error.message", error);
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
  pinHash: async (req, res) => {
    try {
      let hashvar = req.body.hashvar;
      pinata
        .pinByHash(hashvar)
        .then((result) => {
          if (result) {
            let response =
              "https://bleufi.mypinata.cloud/ipfs/" + result.ipfsHash + "/";
            return res.status(200).json({
              data: response,
              status: 200,
              success: true,
              message: "url sen",
            });
          } else {
            return res.status(400).json({
              data: null,
              error: "Not Upload",
              status: 400,
              success: false,
            });
          }
        })
        .catch((err) => {
          return res.status(400).json({
            data: null,
            error: "Not Upload",
            status: 400,
            success: false,
          });
        });
    } catch (error) {
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
};
