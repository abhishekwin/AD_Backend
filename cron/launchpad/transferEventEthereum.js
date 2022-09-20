const axios = require("axios");
const { EventManager } = require("../../models");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
const { LaunchPadNft } = require("../../modules/launchpad/models");
let LAUNCHPAD_SUBGRAPH_URL_ETHEREUM = process.env.LAUNCHPAD_SUBGRAPH_URL_ETHEREUM;
let DB_URL = process.env.DB_URL;

mongoose
  .connect(DB_URL)
  .then(() => {
    //logger.info('Connected to MongoDB');
  })
  .catch((e) => {
    console.log("error", e);
  });

const transferFunctionQuery = async (from) => {
  const url = LAUNCHPAD_SUBGRAPH_URL_ETHEREUM;
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
    const findNft = await LaunchPadNft.find({
      collectionAddress: data.collection_address,
    });
    const index = parseInt(data.tokenId)-1;
    let nft = findNft[index];
    if (nft) {
      const id = nft._id;
       await LaunchPadNft.updateOne(
        { _id: id },
        { tokenId: data.tokenId },
        { new: true }
      );
    }
  }
};

const launchpadTransferEventEthereum = async () => {
  let transfereventDetails = await EventManager.findOne({name:"launchpadTransferV2"})
  let from = 0
  if(transfereventDetails){
     from = transfereventDetails.lastcrontime;
  }else{
      await EventManager.create({name:"launchpadTransferV2", lastcrontime:0})
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

// launchpadTransferEventEthereum();

module.exports = {
    launchpadTransferEventEthereum
};
