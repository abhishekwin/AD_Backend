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

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const getBaseWebDataUsingAxios = async (url, count = 0) => {
    let promise = new Promise(async function (resolve, reject) {
        let result = await axios.get(url).then(function (response) {
            resolve(response.data)
        })
            .catch(function (error) {
                resolve(null)
            })
    });
    return promise;
};


const createNftWithUri = async (id, updateUri, data, failedNfts) => {
    await new Promise(async function (resolve, reject) {

        let baseResponse = await getBaseWebDataUsingAxios(updateUri);

        if (baseResponse == null) {
            await sleep(3000)
            baseResponse = await getBaseWebDataUsingAxios(updateUri);
        }
        if (baseResponse == null) {
            await sleep(3000)
            baseResponse = await getBaseWebDataUsingAxios(updateUri);
        }
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

            if (!existNfts) {
                await LaunchPadNft.create(objNfts)
            }

        } else {
            failedNfts.push(id)
        }
        resolve(failedNfts)
    });
    return failedNfts;
};

const failNftUsingCollectionFuncation = async () => {
    console.log("-----check fail nft start------")
    const data = await LaunchPadCollection.findOne({
        failedNfts: { "$gt": 0 }, $or: [
            { failedNftsCheckCount: { "$lt": 3 } },
            { failedNftsCheckCount: { $exists: false } }
        ]
    });
    if (data) {
        let failedNfts = [];
        let failedNftsCheckCount = data.failedNftsCheckCount+1;
        await LaunchPadCollection.findOneAndUpdate({ _id: data._id }, { status: "syncing", failedNftsCheckCount:failedNftsCheckCount })
        for (let step = 1; step <= data.failedNfts.length; step++) {
            const id = data.failedNfts[step-1]
            updateUri = data.tokenURI + id + ".json";
            let nftCreated = await createNftWithUri(id, updateUri, data, failedNfts);
            failedNfts = nftCreated
        }
        
        if(failedNfts.length > 0 && failedNftsCheckCount > 2){
            await LaunchPadCollection.findOneAndUpdate({ _id: data._id }, { status: "failed", failedNfts: failedNfts })
        }else{
            if(failedNfts.length <= 0 ){
                await LaunchPadCollection.findOneAndUpdate({ _id: data._id }, { status: "completed", failedNfts: failedNfts })
            }
        }
    }

};

// failNftUsingCollectionFuncation();

module.exports = {
  failNftUsingCollectionFuncation
};