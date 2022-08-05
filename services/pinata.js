const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK("64ee41eef8667caafa7a", "6d9491e37178da76fa3580e02187a47534dcbb4459a631b760054984483fe2fb");
// require("")

async function uploadDir(folderPath) {
    return new Promise((resolve, reject) => {
        pinata.pinFromFS(folderPath).then((result) => {
            resolve(result);
        }).catch((err) => {
            //handle error here
            reject(err);
        });
    })    
}

//   uploadDir()

module.exports = {
    uploadDir
}
