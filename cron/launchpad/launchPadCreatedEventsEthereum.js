const axios = require("axios");
const { EventManager } = require("../../models");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../../.env" });
const { LaunchPadNft, LaunchPadCollection, LaunchPadMintHistory } = require("../../modules/launchpad/models");
let LAUNCHPAD_SUBGRAPH_URL_ETHEREUM = process.env.LAUNCHPAD_SUBGRAPH_URL_ETHEREUM;
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
    const url = LAUNCHPAD_SUBGRAPH_URL_ETHEREUM;
    const query = {
        query: `query MyQuery {\n  launchPadCreateds(\n    first: 100\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    TransactionHash\n    ContractURI\n    collection\n    creator\n    maxSupply\n  id\n timestamp\n creationTime\n BlockNumber\n Symbol\n Name\n }\n}`,    
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
        return result.data.data.launchPadCreateds;
    }
    return [];
};

const manageData = async (transferdata) => {
    let timestamp = transferdata[0].timestamp;
    for (data of transferdata) {
        timestamp = data.timestamp
        const findCollection = await LaunchPadCollection.findOne({
            tokenURI: data.ContractURI,
            creator: data.creator,
            symbol: data.Symbol,
            collectionName: data.Name

        });
        if(findCollection){
            findCollection.collectionAddress = data.collection
            await findCollection.save()
        }        
    }
    await EventManager.updateOne({ name: "launchPadCreatedEventsEthereum" }, { lastcrontime: timestamp })
};

const launchPadCreatedEventsEthereum = async () => {
    let transfereventDetails = await EventManager.findOne({ name: "launchPadCreatedEventsEthereum" })
    let from = 0
    if (transfereventDetails) {
        from = transfereventDetails.lastcrontime;
    } else {
        await EventManager.create({ name: "launchPadCreatedEventsEthereum", lastcrontime: 0 })
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

// launchPadCreatedEventsBsc();

module.exports = {
    launchPadCreatedEventsEthereum
};
