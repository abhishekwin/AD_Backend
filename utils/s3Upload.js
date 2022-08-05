const fs = require('fs');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3')
const bucketName = process.env.AWS_S3_BUCKET
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION
})

// const s3 = new aws.S3({
//   accessKeyId: "AKIAXVESBKD4IEKUVAJN",
//   secretAccessKey: "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",
//   region: "us-east-1"
// })

async function uploadFile(filepath, fileName) {
    const fileContent = fs.readFileSync(filepath);
    const params = {
        Bucket: bucketName,
        Key: 'satcat.jpg', // File name you want to save as in S3
        Body: fileContent,
        ContentType: fileContent.type,
        Key: 'nfts-images/'+fileName,
        ACL: 'public-read',
        Bucket: bucketName
    };

    return await new Promise(function (resolve, reject) {
        s3.upload(params, function(err, data) {
            if (err) {
                throw err;
            }
            resolve(data.key)
        }); 
    });
}

// uploadFile();
module.exports={uploadFile}