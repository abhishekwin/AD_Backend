const { uploadImageOnS3}
= require("./s3ImagesUpload/uploadImagesOnS3");
const { uploadImageOnS3Update }
= require("./s3ImagesUpload/uploadImagesOnS3Update")
const { CronManagerModel } = require("../models");

const {launchpadTransferEventBsc} = require('./launchpad/transferEventBsc')
const {launchpadTransferEventEthereum} = require('./launchpad/transferEventEthereum')
const {launchPadCreatedEventsBsc} = require('./launchpad/launchPadCreatedEventsBsc')
const {launchPadCreatedEventsEthereum} = require('./launchpad/launchPadCreatedEventsEthereum')
const {launchpadCollectionEnd} = require('./launchpad/launchPadCollectionEnd')
const {createNftUsingCollectionFuncation} = require('./launchpad/launchPadCreateNftsUsingCollection')
const {failNftUsingCollectionFuncation} = require('./launchpad/launchPadFailNftsUsingCollection')

const {launchpadMintCountTransferEventBsc} = require('./launchpad/mintCountTransferEventBsc')
const {launchpadMintCountTransferEventEthereum} = require('./launchpad/mintCountTransferEventEth')

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const startCronForNftImage = async () => {
    try {
        // console.log("start collection on sale event")
        await uploadImageOnS3();
        await uploadImageOnS3Update();
    }
    catch (e) {
        console.log("&& upload image error", e)
    }     
    startCronForNftImage() 
}

const launchpadTransferEventCron = async () => {
    
    // try {
    //     // console.log("start collection on sale event")
    //     await launchpadTransferEventBsc();
    // }
    // catch (e) {
    //     // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    // } 
    // try {
    //     // console.log("start collection on sale event")
    //     await launchpadTransferEventEthereum();
    // }
    // catch (e) {
    //     // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    // } 

    try {
        // console.log("start collection on sale event")
        await launchPadCreatedEventsBsc();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    } 
    try {
        // console.log("start collection on sale event")
        await launchPadCreatedEventsEthereum();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    } 
    
    try {
        // console.log("start collection on sale event")
        await launchpadCollectionEnd();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }    

    launchpadTransferEventCron() 
}


const bscMint = async () => {
    try {
        await launchpadTransferEventBsc();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }
    bscMint()
}

const ethMint = async () => {
    try {
        await launchpadTransferEventEthereum();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }
    ethMint()
}

launchpadTransferEventCron();
startCronForNftImage()
bscMint(),
ethMint(),

// createLaunchpadNfts(),
// failLaunchpadNfts(),

// failLaunchpadNfts();
// startCron();
module.exports = {
    // createLaunchpadNfts,
    // failLaunchpadNfts,
    // bscMint,
    // ethMint,
    // mintCountUpdateUsingCollectionBsc,
    // mintCountUpdateUsingCollectionEth
};