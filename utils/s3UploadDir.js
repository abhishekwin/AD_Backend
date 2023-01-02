const fs = require('fs');
const path = require('path');
const async = require('async');
const AWS = require('aws-sdk');
const readdir = require('recursive-readdir');
require("dotenv").config({ path: "../.env" });
const bucketName = process.env.AWS_S3_BUCKET
const {
  LaunchPadCollection
} = require("../modules/launchpad/models");

const { BUCKET, KEY, SECRET } = process.env;
const s3 = new AWS.S3({
    signatureVersion: 'v4',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION
})
const rootFolder = path.resolve(__dirname, './');

function getFiles(dirPath) {
  return fs.existsSync(dirPath) ? readdir(dirPath) : [];
}

async function uploadFilesToS3(filesToUpload, dirPath){
    return new Promise((resolve, reject) => {
        async.eachOfLimit(filesToUpload, 10, async.asyncify(async (file) => {
          const Key = file.replace(`${rootFolder}/`, '');
          //console.log("Key", Key)
          const fileName = Key.substring(Key.lastIndexOf('/')+1)
          return new Promise((res, rej) => {
            s3.upload({
              Key: dirPath+"/"+fileName,
              Bucket: bucketName,
              Body: fs.readFileSync(file),
              ACL: 'public-read',
            }, (err) => {
              if (err) {
                return rej(new Error(err));
                res(false)
              }
              res({ s3DirPath: dirPath });               
            });
          });
        }), (err) => {
          if (err) {
            return reject(new Error(err));
          }
          resolve({ s3DirPath: dirPath });
        });
      });
}

async function uploadDirToS3(upload, folderName, removeFolderPath, removeFolderName) {
//   if (!BUCKET || !KEY || !SECRET) {
//     throw new Error('you must provide env. variables: [BUCKET, KEY, SECRET]');
//   }
  const filesToUpload = await getFiles(path.resolve(__dirname, upload));
  const dirPath = 'collection-nfts/'+folderName
  await uploadFilesToS3(filesToUpload, dirPath)
  fs.rmSync(removeFolderPath, { recursive: true, force: true });
  fs.rmSync(removeFolderName, {
    recursive: true,
    force: true,
  });
  await LaunchPadCollection.findOneAndUpdate({s3URI:dirPath},{s3URIStatus:"completed"})
  return true
}

module.exports = {
    uploadDirToS3
}

// uploadDirToS3(uploadFolder)
//   .then(() => {
//     console.log('task complete');
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error(err.message);
//     process.exit(1);
//   });

