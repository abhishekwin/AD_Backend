const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATAAPIKEY, process.env.PINATAAPISECRETAPIKEY);
// require("")

async function uploadDir(folderPath) {
    return new Promise((resolve, reject) => {
        pinata.pinFromFS(folderPath).then((result) => {
            resolve(result);
        }).catch((err) => {
            //handle error here
            console.log("Pinata upload error", err)
            reject(err);
        });
    })    
}

//   uploadDir()

module.exports = {
    uploadDir
}
