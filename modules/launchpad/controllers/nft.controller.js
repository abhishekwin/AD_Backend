const httpStatus = require('http-status');
// const pick = require('../../../utils/pick');
// const ApiError = require('../../../utils/ApiError');
const catchAsync = require('../../../utils/catchAsync');
const ResponseObject = require('../../../utils/ResponseObject');
const { Collection } = require('../services');
const { fileUpload } = require("../../comman/fileUpload");
const { dirname } = require('path');
const appDir = dirname(require.main.filename);
const fs = require('fs');
const { LaunchPadNft, LaunchPadCollection } = require('../models');

const createNft = catchAsync(async (req, res) => {
  try {
    const { files } = req.files;
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
    //const results = await fileUpload(files, true);
    const results = [{
      url:"test"
    },{
      url:"test1"
    }]

    let nftDetails = [];
    let baseArtName = launchPadCollection.baseArtName
    let nftDescription = launchPadCollection.nftDescription
    let nftCount = 1
    for (const image of results) {
      nftName = baseArtName + " #"+ nftCount
      let nftObj = {
        nftName:nftName,
        nftImage:image,
        nftDescription:nftDescription.replace("{name}", nftName),
        mintCost:launchPadCollection.mintCost,
        royalties:launchPadCollection.royalties,
        status:"Active"
      }
      nftDetails.push(nftObj)
      nftCount++
    }

    console.log("launchPadCollection", launchPadCollection)
    // await LaunchPadNft.create()
    res.status(200).send(new ResponseObject(200,  "Nft create success",
      nftDetails
    ));
  } catch (error) {
    res.status(500).send(new ResponseObject(500,  "Somthing went wrong",
      error
    ));
  }
  
});
module.exports = {
    createNft
};
