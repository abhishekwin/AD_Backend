const axios = require("axios");
const { EventManager, Users } = require("../../models");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
const { LaunchPadNft, LaunchPadCollection, LaunchPadMintHistory, LaunchPadHistory } = require("../../modules/launchpad/models");
let LAUNCHPAD_SUBGRAPH_URL_BSC = process.env.LAUNCHPAD_SUBGRAPH_URL_BSC;
let DB_URL = process.env.DB_URL;
let BSC_NETWORK_ID = process.env.BSC_NETWORK_ID
let LAUNCHPAD_BSC_WEB3_URL = process.env.LAUNCHPAD_BSC_WEB3_URL;
const Web3 = require("web3");
const LaunchpadAbi = require("../../config/launchpad/abi.json");

mongoose
  .connect(DB_URL)
  .then(() => {
    //logger.info('Connected to MongoDB');
  })
  .catch((e) => {
    console.log("error", e);
  });

const transferFunctionQuery = async (from, gt) => {
  const url = LAUNCHPAD_SUBGRAPH_URL_BSC;
  const query = {
    query: `query MyQuery {\n  nftTransfers(\n    first: 100\n    where: {timestamp_gt: ${from}, tokenId_gt: ${gt}, tokenId_lt: ${gt+100}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    to\n    timestamp\n    from\n    collection_address\n    tokenId\n  }\n}`,
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
    let collectionAddressForMintCount = ""
    for (data of transferdata) {
      timestamp = data.timestamp
      const findNft = await LaunchPadNft.find({
        collectionAddress: data.collection_address,
        networkId: +BSC_NETWORK_ID
      });
      const index = parseInt(data.tokenId) - 1;
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
        if (findCollection) {
          if (collectionAddressForMintCount != data.collection_address.toLowerCase()) {
            if (findCollection.maxSupply != findCollection.nftMintCount) {
              const web3 = new Web3(LAUNCHPAD_BSC_WEB3_URL)
              const contractInstance = new web3.eth.Contract(LaunchpadAbi.abi, data.collection_address.toLowerCase())
              const mintCountBlockChain = await contractInstance.methods.tokenCounter().call()
              if (mintCountBlockChain) {
                await LaunchPadCollection.findOneAndUpdate({
                  collectionAddress: data.collection_address.toLowerCase(),
                  networkId: +BSC_NETWORK_ID
                }, { nftMintCount: mintCountBlockChain });
              }

            }
            collectionAddressForMintCount = data.collection_address;
          }
          // await LaunchPadCollection.findOneAndUpdate({
          //   collectionAddress: data.collection_address.toLowerCase(),
          //   networkId: +BSC_NETWORK_ID
          // }, { nftMintCount: findCollection.nftMintCount ? findCollection.nftMintCount + 1 : 1 });
        }

        const findAddress = await LaunchPadMintHistory.findOne({
          collectionAddress: data.collection_address,
          userAddress: data.to,
          mintSubId: data.id,
        });
        if (!findAddress) {
          await LaunchPadMintHistory.create({
            collectionAddress: data.collection_address,
            userAddress: data.to,
            mintSubId: data.id,
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

const launchpadTransferEventBsc = async (from = 0, gt = 0) => {
console.log("-----bsc mint cron-----")
  let transfereventDetails = await EventManager.findOne({ name: "launchpadTransferBsc" })
  if (gt >= 100) {
    from = from
  } else if (transfereventDetails) {
    from = transfereventDetails.lastcrontime;
  } else {
    await EventManager.create({ name: "launchpadTransferBsc", lastcrontime: 0 })
  }

  try {
    let transferdata = await transferFunctionQuery(from, gt);
    if (transferdata && transferdata.length > 0) {
      transferdata = transferdata.reverse();
      await manageData(transferdata);
      if (transferdata.length >= 100) {
        gt = gt + 100;
        launchpadTransferEventBsc(from, gt)
      }
    }
  } catch (error) {
    console.log("error", error);
  }

};

// launchpadTransferEventBsc();

module.exports = {
  launchpadTransferEventBsc
};
