const axios = require("axios");
const { EventManager, Users } = require("../../models");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
const { LaunchPadNft, LaunchPadCollection, LaunchPadMintHistory, LaunchPadHistory } = require("../../modules/launchpad/models");
let LAUNCHPAD_SUBGRAPH_URL_BSC = process.env.LAUNCHPAD_SUBGRAPH_URL_BSC;
let DB_URL = process.env.DB_URL;
let BSC_NETWORK_ID = process.env.BSC_NETWORK_ID

mongoose
  .connect(DB_URL)
  .then(() => {
    //logger.info('Connected to MongoDB');
  })
  .catch((e) => {
    console.log("error", e);
  });

const transferFunctionQuery = async (from) => {
  const url = LAUNCHPAD_SUBGRAPH_URL_BSC;
  const query = {
    query: `query MyQuery {\n  nftTransfers(\n    first: 100\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    to\n    timestamp\n    from\n    collection_address\n    tokenId\n  }\n}`,
    variables: null,
    operationName: "MyQuery",
    extensions: {
      headers: null,
    },
  };

  let config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const result = await axios.post(url, query, config);
  if (result.status == 200 && result.data && result.data.data) {
    return result.data.data.nftTransfers;
  }
  return [];
};

const manageData = async (transferdata) => {
  try {
    let timestamp = transferdata[0].timestamp;
    for (data of transferdata) {

      timestamp = data.timestamp
      const findNft = await LaunchPadNft.find({
        collectionAddress: data.collection_address,
        networkId: +BSC_NETWORK_ID
      });
      const index = parseInt(data.tokenId);
      let nft = findNft[index];
    
      if (nft) {
        const id = nft._id;
        await LaunchPadNft.updateOne(
          { _id: id },
          { tokenId: data.tokenId, isMint: true, creator: data.to },
          { new: true }
        );
        
        const findCollection = await LaunchPadCollection.findOne({
          collectionAddress: data.collection_address,
          networkId: +BSC_NETWORK_ID
        });

        if(findCollection){
          await LaunchPadCollection.findOneAndUpdate({
            collectionAddress: data.collection_address.toLowerCase(),
            networkId: +BSC_NETWORK_ID
          }, {nftMintCount:findCollection.nftMintCount?findCollection.nftMintCount+1:1});
        }
        
        const findAddress = await LaunchPadMintHistory.findOne({
          collectionAddress: data.collection_address,
          userAddress: data.to,
        });
        if (!findAddress) {
          await LaunchPadMintHistory.create({
            collectionAddress: data.collection_address,
            userAddress: data.to,
          });
        }
        const UserDetails = await Users.findOne({ account: data.to.toLowerCase() })
        const CollectionDetails = await LaunchPadCollection.findOne({ collectionAddress: data.collection_address.toLowerCase() })
        if (!await LaunchPadHistory.findOne({
          userId: UserDetails ? UserDetails.id : null,
          nftId: id,
          collectionId: CollectionDetails ? CollectionDetails.id : null,
          epochTime: data.timestamp
        })) {
          await LaunchPadHistory.create({
            userId: UserDetails ? UserDetails.id : null,
            nftId: id,
            collectionId: CollectionDetails ? CollectionDetails.id : null,
            epochTime: data.timestamp
          })
        }
      }      
    }
    await EventManager.updateOne({ name: "launchpadTransferBsc" }, { lastcrontime: timestamp })

  } catch (e) {
    console.log("error bsc transfer", e)
  }
};

const launchpadTransferEventBsc = async () => {
  let transfereventDetails = await EventManager.findOne({ name: "launchpadTransferBsc" })
  let from = 0
  if (transfereventDetails) {
    from = transfereventDetails.lastcrontime;
  } else {
    await EventManager.create({ name: "launchpadTransferBsc", lastcrontime: 0 })
  }

  try {
    let transferdata = await transferFunctionQuery(from);
    if (transferdata && transferdata.length > 0) {
      transferdata = transferdata.reverse();
      await manageData(transferdata);
    }
  } catch (error) {
    console.log("error", error);
  }
};

// launchpadTransferEventBsc();

module.exports = {
  launchpadTransferEventBsc
};
