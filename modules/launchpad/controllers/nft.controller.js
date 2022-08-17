const httpStatus = require('http-status');
// const pick = require('../../../utils/pick');
// const ApiError = require('../../../utils/ApiError');
const catchAsync = require('../../../utils/catchAsync');
const ResponseObject = require('../../../utils/ResponseObject');
const { Collection } = require('../services');
const { fileUpload, uploadMultiJsonData } = require("../../comman/fileUpload");
const { dirname } = require('path');
const appDir = dirname(require.main.filename);
const fs = require('fs');
const { LaunchPadNft, LaunchPadCollection } = require('../models');
const path = require('path');

const createNft = async (req, res) => {
  try {
    const { files } = req;
    const { collectionId } = req.body;
    const publicdir = appDir+'/public';
    if (!fs.existsSync(publicdir)) {
      fs.mkdirSync(publicdir, 0744);                  
    }
    const uploaddir = appDir+ '/public/uploads';
    if(!fs.existsSync(uploaddir)){
      fs.mkdirSync(uploaddir, 0744);
    }
    const launchPadCollection = await LaunchPadCollection.findOne({_id:collectionId})
    if(!launchPadCollection){
      res.status(204).send(new ResponseObject(204,  "Collection not found",
        []
      ));
    }
    const results = await fileUpload(files, true);
    let nftDetails = [];
    let baseArtName = launchPadCollection.baseArtName
    let nftDescription = launchPadCollection.nftDescription
    let nftCount = 1
    for (const image of results) {
      nftName = baseArtName + " #"+ nftCount
      let nftObj = {
        nftName:nftName,
        nftImage:image.url,
        nftDescription:nftDescription.replace("{name}", nftName),
        mintCost:launchPadCollection.mintCost,
        royalties:launchPadCollection.royalties,
        status:"Active"
      }
      await LaunchPadNft.create({...nftObj});
      nftDetails.push(nftObj)
      nftCount++
    }
    const result = await uploadMultiJsonData(nftDetails);
    res.status(200).send(new ResponseObject(200,  "Nft create success",
      result
    ));
  } catch (error) {
    res.status(500).send(new ResponseObject(500,  "Somthing went wrong",
      error
    ));
  }
  
};


module.exports = {
    createNft
};
