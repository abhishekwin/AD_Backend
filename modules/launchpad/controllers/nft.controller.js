const httpStatus = require('http-status');
// const pick = require('../../../utils/pick');
// const ApiError = require('../../../utils/ApiError');
const fs = require('fs');
const catchAsync = require('../../../utils/catchAsync');
const ResponseObject = require('../../../utils/ResponseObject');
const { Collection } = require('../services');
const { fileUpload, uploadMultiJsonData } = require("../../comman/fileUpload");
const { dirname } = require('path');
const appDir = dirname(require.main.filename);
const { LaunchPadNft, LaunchPadCollection } = require('../models');
const path = require('path');

const createNft = async (req, res) => {
  try {
    const { files } = req;
    const { collectionId } = req.body;
    const publicdir = appDir + '/public';
    if (!fs.existsSync(publicdir)) {
      fs.mkdirSync(publicdir, 0744);
    }
    const uploaddir = appDir + '/public/nft-files';
    if (!fs.existsSync(uploaddir)) {
      fs.mkdirSync(uploaddir, 0744);
    }
    const launchPadCollection = await LaunchPadCollection.findOne({ _id: collectionId })
    if (!launchPadCollection) {
      return res.status(400).send(new ResponseObject(400, "Collection not found",
        []
      ));
    }
    const results = await fileUpload(files, true);
    let nftDetails = [];
    let baseArtName = launchPadCollection.baseArtName
    let nftDescription = launchPadCollection.nftDescription
    let nftCount = 1
    for (const image of results) {
      nftName = baseArtName + " #" + nftCount
      let nftObj = {
        nftName: nftName,
        nftImage: image.url,
        nftDescription: nftDescription.replace("{name}", nftName),
        mintCost: launchPadCollection.mintCost,
        royalties: launchPadCollection.royalties,
        status: "Active"
      }
      let otherNftData = {
        collectionId: launchPadCollection._id,
        nftS3Image: image.s3Images
      }
      const launchpadnft = await LaunchPadNft.findOne({ collectionId: launchPadCollection._id, nftName: nftName });
      if (launchpadnft) {
        await LaunchPadNft.findByIdAndUpdate({ _id: launchpadnft._id }, { ...otherNftData, ...nftObj });
      } else {
        await LaunchPadNft.create({ ...otherNftData, ...nftObj });
      }
      nftDetails.push(nftObj)
      nftCount++
    }
    const result = await uploadMultiJsonData(nftDetails);
    fs.rmSync(uploaddir, { recursive: true, force: true });
    if(result && result.IpfsHash){
      await LaunchPadCollection.findOneAndUpdate({ _id: collectionId }, {tokenURI:"https://bleufi.mypinata.cloud/ipfs/"+result.IpfsHash}, {
        new: true,
      });
    }
    res.status(200).send(new ResponseObject(200, "Nft create successfully",
      result
    ));
  } catch (error) {
    res.status(500).send(new ResponseObject(500, "Something went wrong",
      error
    ));
  }

};


module.exports = {
  createNft
};
