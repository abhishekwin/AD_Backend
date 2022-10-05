const { LaunchPadNft, LaunchPadCollection, LaunchPadMintHistory, LaunchPadHistory } = require("../../modules/launchpad/models");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
let DB_URL = process.env.DB_URL;
mongoose
  .connect(DB_URL)
  .then(() => {
    //logger.info('Connected to MongoDB');
  })
  .catch((e) => {
    console.log("error", e);
  });

const launchpadCollectionEnd = async () => {
    const lanchpadCollectionlist = await LaunchPadCollection.find({status:{$ne:"ended"}});
    for (const iterator of lanchpadCollectionlist) {
        await LaunchPadCollection.findOneAndUpdate({_id:iterator._id}, {status:"completed"});
        if(iterator.maxSupply == iterator.nftMintCount){
            await LaunchPadCollection.findOneAndUpdate({_id:iterator._id}, {status:"ended"});
        }
    }
};

// launchpadCollectionEnd();

module.exports = {
  launchpadCollectionEnd
};
