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

const { launchpadMintRangeBsc } = require("./launchpad/transferMintRangeBsc");
const { launchpadMintRangeETH } = require("./launchpad/transferMintRangeEth");

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

const bscMintRange = async () => {
    let interval;
    try {
        await launchpadMintRangeBsc();
        clearInterval(interval)
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }
   bscMintRange()
    
}

const ethMintRange = async () => {
    let interval;
    try {
        await launchpadMintRangeETH();
        clearInterval(interval)
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }
    ethMintRange()
    
}

ethMintRange();
bscMintRange();
launchpadTransferEventCron();
startCronForNftImage()
bscMint();
ethMint();

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