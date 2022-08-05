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

// const download = async function(uri, filename, nft, callback){
//   setTimeout(()=>{
//     try{
//       request.head(uri, async function(err, res, body){
//         if(err){
//           console.log("err", err)
//         }else if(!res.headers['content-type'].includes("image")){
//           await ImageUploadLogs.create({
//             tokenURI:nft.tokenURI,
//             imageUrl:uri,
//             nftId:nft.id,
//             error: res.headers['content-type']
//           });
//           await Nfts.findOneAndUpdate({_id:nft.id}, {
//             awsImagesUpdated:true
//           });
//         }
//         request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
//       });
//     }catch(e){
//       console.log(e)
//     }
    
//   }, 10000)
  
// };

async function downloadImage(url, filepath) {
  try{
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
      response.data.pipe(fs.createWriteStream(filepath))
          .on('error', () => resolve(false))
          .once('close', () => resolve(filepath)); 
    });
  }catch(e){
    return response = null
  }
  
}

async function storeImage(url, filepath) {
  const publicdir = appDir+'/public';
  if (!fs.existsSync(publicdir)) {
    fs.mkdirSync(publicdir, 0744);                  
  }
  const uploaddir = appDir+ '/public/nft-image-upload';
  if(!fs.existsSync(uploaddir)){
    fs.mkdirSync(uploaddir, 0744);
  }
  return await downloadImage(url, filepath)
  
}

const createThumbnail = async (path, height, width) => {
    let options = { width: width, height: height, responseType: 'base64', jpegOptions: { force:true, quality:90 } }
    try {
        const thumbnail = await imageThumbnail(path, options);
        const buffer = Buffer.from(thumbnail, "base64");
        const randumFileName = height+'X'+ width + uniqid();
        const uploadFilePath = appDir+'/public/nft-image-upload/'+randumFileName+'.png'
        fs.writeFileSync(uploadFilePath, buffer);
        return uploadFilePath;
    } catch (err) {
        console.error(err);
    }
}


const storeImageOnLocal = async (imageUrl, nft) => {    
    const randumFileName = uniqid();
    const imageURL = imageUrl
    const filepath = await storeImage(imageURL, appDir+'/public/nft-image-upload/'+randumFileName+'.png');
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

const getImageUrlFromTokenUri = async (tokenURIUrl) => {
    let config = {
        headers: {
            "Content-Type": "application/json"
        }
    }
    const result = await axios.get(tokenURIUrl, {}, config);
    if(result.status == 200 && result.data){
      if(result.data && result.data.image){
        if(!result.data.image.includes("bleufi.mypinata.cloud")){
            if(result.data.image.includes("ipfs://")){
            let imgurl =  result.data.image.replace("ipfs://", 'https://bleufi.mypinata.cloud/ipfs/')
            return imgurl
            }else if(result.data.image.includes("pinata.cloud")){
                let imgurl =  result.data.image.replace(/^.*\/\/[^\/]+/, 'https://bleufi.mypinata.cloud')
                return imgurl
            }else{
                return result.data.image  
            }
        
        }else{
            return result.data.image      
        }
      }else{
          return null
      }
    }
}


const uploadImageOnS3 = async () => {
    console.log("*****S3*****")
    const filter = {$or: [{awsImagesUpdated:false}, {awsImagesUpdated: {$exists:false}}]}
    const nfts = await Nfts.find(filter).limit(1).sort({"createdAt":-1});
    let nftImageDir = appDir+'/public/nft-image-upload'
    
    if (fs.existsSync(nftImageDir)) {
      fs.promises.rmdir(nftImageDir, {
        recursive: true
      })    
    }
    for (const nft of nfts) {
      // console.log("Token-URI", nft.tokenURI, nft.id)
      if(nft && nft.tokenURI){
        try{
          const imageUrl = await getImageUrlFromTokenUri(nft.tokenURI);
          if(imageUrl){
            if(isNaN(imageUrl)){
              const nftImage = await storeImageOnLocal(imageUrl, nft);
              await Nfts.findOneAndUpdate({_id:nft.id}, {
                awsImage: nftImage,
                awsImagesUpdated:true
              });
            }else{
              await Nfts.findOneAndUpdate({_id:nft.id}, {
                awsImagesUpdated:true
              });
            }
          }else{
              await Nfts.findOneAndUpdate({_id:nft.id}, {
                  awsImagesUpdated:true
              });
              await ImageUploadLogs.create({
                  tokenURI:nft.tokenURI,
                  nftId:nft.id,
                  error: "Image url not found"
                });
          }
          
        }catch(e){
          //console.log("ett")
          await Nfts.findOneAndUpdate({_id:nft.id}, {
            awsImagesUpdated:true
          });
        } 
          //console.log("Done")
      }else{
        await Nfts.findOneAndUpdate({_id:nft.id}, {
          awsImagesUpdated:true
        });
      }
    }
}
//  uploadImageOnS3();
module.exports = {
  uploadImageOnS3
};
