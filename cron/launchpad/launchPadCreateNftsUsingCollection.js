const { LaunchPadNft, LaunchPadCollection, LaunchPadMintHistory, LaunchPadHistory } = require("../../modules/launchpad/models");
const mongoose = require("mongoose");
const axios = require("axios");
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

const getBaseWebData = async (url) => {
  const result = await axios.get(url);
  if (result.status == 200) {
    return result.data;
  }
  return null;
};
const createNftUsingCollectionFuncation = async () => {
  console.log("Nft create start")
  const data = await LaunchPadCollection.findOne({ status: "ready-to-syncup" });
  if (data) {
    for (let step = 1; step <= data.maxSupply; step++) {
      const id = step
      updateUri = data.tokenURI + id + ".json";
      baseResponse = await getBaseWebData(updateUri);
      if (baseResponse) {
        let objNfts = {
          collectionId: data._id,
          collectionAddress: data.collectionAddress,
          royalties: data.royalties ? data.royalties : 0,
          name: baseResponse.name,
          description: baseResponse.description,
          image: baseResponse.image,
          tokenURI: updateUri ? updateUri : null,
          owner: data.creator,
          creator: data.creator,
          tokenId: id,
          // dna: baseResponse.dna,
          attributes: baseResponse.attributes,
          compiler: baseResponse.compiler,
          currency: data.currency,
          isFirstSale: true,
          mintCost: data.mintCost,
          royalties: data.royalties,
          status: "Active",
          isActive: true,
          networkId: data.networkId,
          networkName: data.networkName,
        };

        let existNfts = await LaunchPadNft.findOne({
          collectionId: data._id,
          tokenId: id
        });

        if (existNfts) {
          //await LaunchPadNft.findOneAndUpdate({ collectionId: data._id, tokenId: id }, objNfts)
        } else {
          await LaunchPadNft.create(objNfts)
        }
      }
    }
    await LaunchPadCollection.findOneAndUpdate({ _id: data._id}, { status: "completed" })
  }

};

// createNftUsingCollectionFuncation();

module.exports = {
    createNftUsingCollectionFuncation
};