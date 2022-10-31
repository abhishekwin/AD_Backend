const { uploadFile } = require('../../utils/s3Upload')
const axios = require('axios');
const uniqid = require('uniqid'); 
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const client = require('https');
const { LaunchPadNft, LaunchPadImageUploadLogs} = require("../../modules/launchpad/models");
require('dotenv').config({path: '../../.env'});
const mongoose = require('mongoose');
request = require('request');
const { dirname } = require('path');
const appDir = dirname(require.main.filename);

const uploadImageOnS3Update = async () => {
    const filter = {awsImagesUpdated:true, awsImage: null}
    const nfts = await LaunchPadNft.find(filter, {
        awsImagesUpdated:false
    });
    for (const nft of nfts) {
        let count = nft.awsImagesTryCount;
        if(nft.awsImagesTryCount < 3){
            await LaunchPadNft.updateOne({_id:nft._id}, {
                awsImagesUpdated:false,
                awsImagesTryCount:count+1
            });
        }else{
            await LaunchPadNft.updateOne({_id:nft._id}, {
                awsImagesUpdated:true
            });
        }
        
    }
   
}
//  uploadImageOnS3();
module.exports = {
  uploadImageOnS3Update
};
