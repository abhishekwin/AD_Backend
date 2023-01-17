const { LaunchPadNft, LaunchPadCollection, LaunchPadMintHistory, LaunchPadHistory } = require("../../modules/launchpad/models");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
const { getUTCDate, createUTCDate } = require("../../modules/helpers/timezone")
let DB_URL = process.env.DB_URL;
mongoose
  .connect(DB_URL)
  .then(() => {
    //logger.info('Connected to MongoDB');
  })
  .catch((e) => {
    console.log("error", e);
  });

const launchpadCollectionPhaseEnd = async () => {
  let launchpadCollections = await LaunchPadCollection.find({status:{$ne:"ended"}}).populate([
    {
      path: "phases"
    },
  ])
  for (const iterator of launchpadCollections) {
    let isEnd = false
    for (const phase of iterator.phases) {
      console.log("--", phase.endTime , "****", await getUTCDate())
      isEnd = false
      if(phase.endTime < await getUTCDate()){
        isEnd = true
      }     
    }
    if(isEnd){
      await LaunchPadCollection.findOneAndUpdate({_id:iterator._id}, {status:"ended"})
    }
  }
  
  
};

const launchpadCollectionEnd = async () => {
    const lanchpadCollectionlist = await LaunchPadCollection.find({status:{$ne:"ended"}});
    for (const iterator of lanchpadCollectionlist) {
       // await LaunchPadCollection.findOneAndUpdate({_id:iterator._id}, {status:"completed"});
        if(iterator.maxSupply == iterator.nftMintCount){
            await LaunchPadCollection.findOneAndUpdate({_id:iterator._id}, {status:"ended"});
        }
    }
    launchpadCollectionPhaseEnd()
};

// launchpadCollectionEnd();

module.exports = {
  launchpadCollectionEnd
};
