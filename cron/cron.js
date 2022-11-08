
const { getTransferFunction }
= require("./transfer");
const { auctionCancel }
= require("./auctioncancel");
const { auctionCreate }
= require("./auctioncreate");
const { auctionBid }
= require("./auctionbid");
const { auctionEnd }
= require("./auctionend");
const { offSale }
= require("./fixedmarketoffsale");
const { onSale }
= require("./fixedmarketonsale");
const { sold }
= require("./fixedmarketonsold");
// const { onSaleEvent }
// = require("./onsaleevent");
const { createCollection }
= require("./collectioncreate");
const { collectionSalesEvent }
= require("./collectiononsale");
const { createNftUsingMoralises }
= require("./getNftAndInsertUsingMoralis");
const { transferEventV2 }
= require("./transferEventV2");

const { uploadImageOnS3}
= require("./s3ImagesUpload/uploadImagesOnS3");
const { uploadImageOnS3Update }
= require("./s3ImagesUpload/uploadImagesOnS3Update")
const { CronManagerModel } = require("../models");

const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');
const {launchpadTransferEventBsc} = require('./launchpad/transferEventBsc')
const {launchpadTransferEventEthereum} = require('./launchpad/transferEventEthereum')
const {launchPadCreatedEventsBsc} = require('./launchpad/launchPadCreatedEventsBsc')
const {launchPadCreatedEventsEthereum} = require('./launchpad/launchPadCreatedEventsEthereum')
const {launchpadCollectionEnd} = require('./launchpad/launchPadCollectionEnd')
const {createNftUsingCollectionFuncation} = require('./launchpad/launchPadCreateNftsUsingCollection')
const {failNftUsingCollectionFuncation} = require('./launchpad/launchPadFailNftsUsingCollection')

Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

// const startCron = async () => {
//     try{

//         console.log("*** start cron ***")
//         sleep(10000)
//         try {
//             // console.log("start collection")
//             await createCollection();
//         }
//         catch (e) {
//             Sentry.captureException(e)
//             console.error("&&&&&&&&&&&&&&&&&&& createCollection ", e)
//         }

//         try {
//             // console.log("start auction bid")
//             await auctionBid();
//         }
//         catch (e) {
//             Sentry.captureException(e)
//             console.error("&&&&&&&&&&&&&&&&&&& auctionBid ", e)
//         }
                
//         try {
//             // console.log("start auction cancel")
//             await auctionCancel();
//         }
//         catch (e) {
//             Sentry.captureException(e)
//             console.error("&&&&&&&&&&&&&&&&&&& auctionCancel ", e)
//         }
//         try {
//             // console.log("start auction create")
//             await auctionCreate();
//         }
//         catch (e) {
//             Sentry.captureException(e)
//             console.error("&&&&&&&&&&&&&&&&&&& auctionCreate ", e)
//         }
//         try {
//             // console.log("start auction end")
//             await auctionEnd();
//         }
//         catch (e) {
//             Sentry.captureException(e)
//             console.error("&&&&&&&&&&&&&&&&&&& auctionEnd ", e)
//         }

//         try {
//             // console.log("start get transfer")
//             await getTransferFunction();
//         }
//         catch (e) {
//             Sentry.captureException(e)
//             console.error("&&&&&&&&&&&&&&&&&&& getTransferFunction ", e)
//         }

//         try {
//             // console.log("start off sale")
//             await offSale();
//         }
//         catch (e) {
//             Sentry.captureException(e)
//             console.error("&&&&&&&&&&&&&&&&&&& offSale ", e)
//         }

//         try {
//             // console.log("start on sale")
//             await onSale();
//         }
//         catch (e) {
//             Sentry.captureException(e)
//             console.error("&&&&&&&&&&&&&&&&&&& onSale ", e)
//         }

        
                
//         try {
//             // console.log("start auction sold")
//             await sold();
//         }
//         catch (e) {
//             // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
//         }

//         try {
//             // console.log("start collection on sale event")
//             await collectionSalesEvent();
//         }
//         catch (e) {
//             // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
//         } 
//         try {
//             // console.log("start collection on sale event")
//             await transferEventV2();
//         }
//         catch (e) {
//             // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
//         }      
//         startCron() 
//     }catch(e) {
//         Sentry.captureException(e)
//         console.error("%%%%%%%%%%%%%% e ", e)
//         await startCron()
//     }
// }

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
        await launchpadTransferEventBsc();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    } 
    try {
        // console.log("start collection on sale event")
        await launchpadTransferEventEthereum();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    } 
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

    try {
        // console.log("start collection on sale event")
        await createNftUsingCollectionFuncation();
        await failNftUsingCollectionFuncation();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }     
    launchpadTransferEventCron() 
}

// const createLaunchpadNfts = async () => {
    
        
//     createLaunchpadNfts() 
// }

launchpadTransferEventCron();
startCronForNftImage()
//createLaunchpadNfts();
// startCron();


