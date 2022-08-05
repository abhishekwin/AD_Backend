const { CollectionNFTs, Users, Nfts, Nonce, History } = require("../models");
const helpers = require("../helpers/helper");
// const BleuFiNFT = require("../config/bleufi.json")
const jwt = require('jsonwebtoken');
const Web3 = require("web3");
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
const specialCharacter = require('../helpers/RegexHelper');
const jwt_decode = require('jwt-decode');
const pinataSDK = require('@pinata/sdk');
const path = require('path');
const pinata = pinataSDK(process.env.PINATAAPIKEY, process.env.PINATAAPISECRETAPIKEY);
const fs = require('fs');
const {uploadDir} = require("../services/pinata");
const getjson = (file) => {
  const readableStreamForFile = fs.createReadStream(file.path);
  const jsonString = fs.readFileSync("./public/files/"+file.originalname);
  const jsondata = JSON.parse(jsonString);
  return jsondata
}
const appRoot = require('app-root-path');

module.exports = {
  uploadFile: async (req, res) => {
    try{  
         
    const readableStreamForFile = fs.createReadStream(req.file.path);
    const filename = __dirname+req.file.originalname;
    pinata.pinFileToIPFS(readableStreamForFile).then((result) => {
        if(result){
          fs.unlink(req.file.path,function(){
              //fs.rmdir('node');
          });
          result.url =  "https://bleufi.mypinata.cloud/ipfs/"+result.IpfsHash;
          return res.status(200).json({
            data: result,
            status: 200,
            success: true,
            message: "url sen",
          });
        }else{
          return res.status(400).json({
            data: null,
            error: "Not Upload",
            status: 400,
            success: false,
          });
        }
        

    }).catch((err) => {
      return res.status(400).json({
        data: null,
        error: "Not Upload",
        status: 400,
        success: false,
      });
    });

    }catch(error){
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
  uploadJson: async (req, res) => {
    try{   
      // const readableStreamForFile = fs.createReadStream(req.file.path);
    // const filename = __dirname+req.file.originalname;
            const body = req.body?req.body:{}
            pinata.pinJSONToIPFS(body).then((result) => {
              if(result){
                  result.url =  "https://bleufi.mypinata.cloud/ipfs/"+result.IpfsHash;
                    return res.status(200).json({
                    data: result,
                    status: 200,
                    success: true,
                    message: "url sen",
                  });
                }else{
                  return res.status(400).json({
                    data: null,
                    error: "Not Upload",
                    status: 400,
                    success: false,
                  });
                }
                

            }).catch((err) => {
              return res.status(400).json({
                data: null,
                error: "Not Upload",
                status: 400,
                success: false,
              });
            });

    }catch(error){
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
  uploadMultiJsonData: async (req, res) => { 
    try{
      const filename = "";
      
      let filedatas = getjson(req.file);
      
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
      fs.rmSync(appRoot.path+'/'+req.file.path, { recursive: true, force: true });
      
      return res.status(200).json({
        data: result,
        status: 200,
        success: true,
        message: "url sent",
      });
    }catch(error){
      console.error("error.message", error)
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }   
  },
  pinHash: async (req, res) => {
    try{   
      let hashvar = req.body.hashvar;
      pinata.pinByHash(hashvar).then((result) => {
        if(result){
          let response =  "https://bleufi.mypinata.cloud/ipfs/"+result.ipfsHash+"/";
          return res.status(200).json({
            data: response,
            status: 200,
            success: true,
            message: "url sen",
          });
        }else{
          return res.status(400).json({
            data: null,
            error: "Not Upload",
            status: 400,
            success: false,
          });
        }
      }).catch((err) => {
        return res.status(400).json({
          data: null,
          error: "Not Upload",
          status: 400,
          success: false,
        });
      });

    }catch(error){
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  }
  
}
