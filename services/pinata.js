const pinataSDK = require('@pinata/sdk');
const { LaunchPadPinataUploadManager } = require('../modules/launchpad/models');
const pinata = pinataSDK(process.env.PINATAAPIKEY, process.env.PINATAAPISECRETAPIKEY);
// require("")

async function uploadDir(folderPath){
    return new Promise((resolve, reject) => {
        pinata.pinFromFS(folderPath).then(async (result) => {
            resolve(result);
        }).catch((err) => {
            //handle error here
            console.log("Pinata upload error", err)
            reject(err);
        });
    })  
}
async function uploadDirWithManager(folderPath, uniqIdForPinata, userAddress) {
    await LaunchPadPinataUploadManager.create({uniqId:uniqIdForPinata, status: "in-progress", userAddress:userAddress});
    let result = await uploadDir(folderPath, uniqIdForPinata, userAddress)
    if(result){
        await LaunchPadPinataUploadManager.findOneAndUpdate({uniqId:uniqIdForPinata},
            {status:"completed", pinataUploadHash:result}
        );
    }
      
}

//   uploadDir()

module.exports = {
    uploadDir,
    uploadDirWithManager
}
