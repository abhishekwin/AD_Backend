const axios = require("axios");
const { EventManager } = require("../../models");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
const { LaunchPadNft, LaunchPadCollection } = require("../../modules/launchpad/models");
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
  for (data of transferdata) {
    const findCollection = await LaunchPadCollection.findOne({
      collectionAddress: data.collection_address
    });
    if(findCollection){
      const updateMintCount = findCollection.nftMintCount+1
      await updateMintCount.save()
    }
    const findNft = await LaunchPadNft.find({
      collectionAddress: data.collection_address,
      networkId : BSC_NETWORK_ID
    });
    const index = parseInt(data.tokenId)-1;
    let nft = findNft[index];
    if (nft) {
      const id = nft._id;
       await LaunchPadNft.updateOne(
        { _id: id },
        { tokenId: data.tokenId , isMint:true},
        { new: true }
      );
    }
  }
};

const launchpadTransferEventBsc = async () => {
  let transfereventDetails = await EventManager.findOne({name:"launchpadTransferBsc"})
  let from = 0
  if(transfereventDetails){
     from = transfereventDetails.lastcrontime;
  }else{
      await EventManager.create({name:"launchpadTransferBsc", lastcrontime:0})
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
