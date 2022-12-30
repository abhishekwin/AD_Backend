const axios = require("axios");
const { EventManager, Users } = require("../../models");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
const { LaunchPadNft } = require("../../modules/launchpad/models");
let { LAUNCHPAD_SUBGRAPH_URL_ETHEREUM, DB_URL, ETHEREUM_NETWORK_ID } = process.env;
// let DB_URL = process.env.DB_URL;

mongoose
  .connect(DB_URL)
  .then(() => {
    //logger.info('Connected to MongoDB');
  })
  .catch((e) => {
    console.log("error", e);
  });

const transferFunctionQuery = async (from, gt) => {
  const url = LAUNCHPAD_SUBGRAPH_URL_ETHEREUM;
  const query = {
    query: `query MyQuery {\n  mintRanges(skip: ${gt}, first: 100, orderBy: timestamp, orderDirection: desc, where: {timestamp_gt: ${from}}) {\n    startRange\n    mintCurrency\n    endRange\n    id\n  timestamp\n  mintFee\n  collectionAddress\n }\n}`,
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
    return result.data.data.mintRanges;
  }
  return [];
};

const manageData = async (transferdata) => {
  try {
    let timestamp = transferdata[0].timestamp;
    // let collectionAddressForMintCount = ""
    const networkId = parseInt(ETHEREUM_NETWORK_ID, 10);
    for (data of transferdata) {
      for(let d = parseInt(data.startRange, 10); d <= parseInt(data.endRange, 10); d += 1) {
        const createData = { 
          collectionAddress: data.collectionAddress,
          subgraphRange: `${data.startRange}-${data.endRange}`,
          subgraphMintCurrency: data.mintCurrency,
          networkId: networkId,
          subgraphMintTime: data.timestamp ? parseInt(data.timestamp, 10) : null,
          subgraphMintId: data.id,
          subgraphMintFee: data.mintFee,
          isSubgraphMinted: true,
        };
        timestamp = data.timestamp;
        const dataExist = await LaunchPadNft.findOne({ networkId: networkId, collectionAddress: data.collectionAddress, tokenId: `${d}` });
        if (dataExist) {
          await LaunchPadNft.updateOne(
            { _id: dataExist._id },
            { ...createData },
            { new: true }
          );
        }
      }
    }
    await EventManager.updateOne({ name: "launchpadMintRangeETH" }, { lastcrontime: timestamp })

  } catch (e) {
    console.log("error etherium mint transfer", e)
  }
};

const launchpadMintRangeETH = async (from = 0, gt = 0) => {
  // console.log("-----ETH mint range cron-----")
  let transfereventDetails = await EventManager.findOne({ name: "launchpadMintRangeETH" })
  if (gt >= 100) {
    from = from
  } else if (transfereventDetails) {
    from = transfereventDetails.lastcrontime;
  } else {
    await EventManager.create({ name: "launchpadMintRangeETH", lastcrontime: 0 })
  }

  try {
    
    let transferdata = await transferFunctionQuery(from, gt);
   
    if (transferdata && transferdata.length > 0) {
      transferdata = transferdata.reverse();
      // console.log("bsctransferdata", transferdata)
      await manageData(transferdata);
      if (transferdata.length >= 100) {
        gt = gt + 100;
        launchpadMintRangeETH(from, gt)
      }
    }

  } catch (error) {
    console.log("error", error);
  }

};

// launchpadMintRangeETH();

module.exports = {
  launchpadMintRangeETH
};
