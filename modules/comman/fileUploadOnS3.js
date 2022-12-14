const { uploadFile } = require('../../utils/s3Upload')
const axios = require('axios');
const uniqid = require('uniqid'); 
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const client = require('https');
const { Nfts, ImageUploadLogs} = require("../../models");
require('dotenv').config({path: '../../.env'});
const mongoose = require('mongoose');
request = require('request');
const { dirname } = require('path');
const appDir = dirname(require.main.filename);


mongoose.connect(process.env.DB_URL, ).then(() => {
    //logger.info('Connected to MongoDB');
  }).catch((e) =>{
      console.log("error", e)
});

const thumbnailSize = [
    [200, 200],
    [400, 400]
]

const createThumbnail = async (path, height, width) => {
    let options = { width: width, height: height, responseType: 'base64', jpegOptions: { force:true, quality:90 } }
    try {
        const thumbnail = await imageThumbnail(path, options);
        const buffer = Buffer.from(thumbnail, "base64");
        const randumFileName = height+'X'+ width + uniqid();
        const uploaddir = appDir+ '/public/nft-files';
        if(!fs.existsSync(uploaddir)){
            fs.mkdirSync(uploaddir, 0744);
        }
        const uploadFilePath = appDir+'/public/nft-files/'+randumFileName+'.png'
        fs.writeFileSync(uploadFilePath, buffer);
        return uploadFilePath;
    } catch (err) {
        console.error(err);
    }
}


const storeImageOnLocal = async (filepath) => {   
    if(filepath == null){
      return null;
    }
    const nftImages = {
      png:{},
      webp:{}
    }
    
    for (const thumbnail of thumbnailSize) {
      const height = thumbnail[0]
      const width = thumbnail[1]
      const filePathUrl = await createThumbnail(filepath, height, width);
      const randumFileName = uniqid();
      const pngFileName = randumFileName+".png"
      const pngurl = await uploadFile(filePathUrl, pngFileName);
      nftImages.png[height+'X'+width] =  pngurl;
      const randumFileNameWebp = uniqid();
      const webpFileName = randumFileNameWebp + ".webp"
      const webpurl = await uploadFile(filePathUrl, webpFileName);
      nftImages.webp[height+'X'+width]= webpurl;      
    }
    return nftImages;
    // console.log("filepath", filepath)
}



const uploadImageOnS3 = async (filepath) => {
   return await storeImageOnLocal(filepath)
}
//  uploadImageOnS3();
module.exports = {
  uploadImageOnS3
};
