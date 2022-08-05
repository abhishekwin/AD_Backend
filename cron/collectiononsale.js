const axios = require('axios');
const fs = require('fs')
const blueFiAbi = require("../config/bleufi.json")
const reserveAuction = require("../config/reserveAuction.json")

const Web3 = require('web3')
const { Nfts, EventManager, Bid, Users, History, CollectionNFTs } = require("../models");
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
const {createNft} = require("./createnft")
let RESERVE_MARKETPLACE = process.env.RESERVE_MARKETPLACE;
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
let DELAY_SECOUND = process.env.DELAY_SECOUND


//console.log("process.env.DB_URL", process.env.DB_URL)
mongoose.connect(process.env.DB_URL, ).then(() => {
  //logger.info('Connected to MongoDB');
}).catch((e) =>{
    console.log("error", e)
});

const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');

Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });

const collectionOnSaleQuery = async (from) => {
    const url = SUB_GRAPH_URL;
    const query = {
        "query": `query MyQuery {\n  collectionSales(\n    first: 50\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    nftContractAddress\n  onSale\n    saleTime\n    price\n   timestamp\n}\n}`,
        "variables": null,
        "operationName": "MyQuery",
        "extensions": {
            "headers": null
        }
    };

    let config = {
        headers: {
            "Content-Type": "application/json"
        }
    }

    const result = await axios.post(url, query, config);
    if(result.status == 200 && result.data && result.data.data){
        return result.data.data.collectionSales
    }
    return []
};

const updateCollection = async(address, newUpdateData) => {
    let result = await CollectionNFTs.findOne({collectionAddress: address})
    if(result){
        let payLoad = {
            isSale: newUpdateData.onSale
        }
        await CollectionNFTs.findOneAndUpdate({collectionAddress: address}, payLoad)
    }
}

const updateNfts = async(address, newUpdateData) => {
    let payLoad = {
        isSale: newUpdateData.onSale,
        price: newUpdateData.price
    }
    await Nfts.updateMany({collectionAddress: address, isFirstSale:true}, payLoad)
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const historyCreate = async (address, data, web3callcount=0) => {
    
    try{
        let collectionAddress = address
        let nfts = await Nfts.find({collectionAddress:collectionAddress});
        let count = 1
        for (const nft of nfts) {
            subGraphId = data.id+count
            count++
            let history = await History.findOne({subGraphId:subGraphId});
            let user = await Users.findOne({account:nft.owner});
            if(!history){
                await History.create({
                    userId: user?user.id:null,
                    oldUserId: null,
                    nftId:nft?nft.id:null,
                    actionType: 6, 
                    price:nft?nft.price:0, 
                    paymentType:nft?nft.paymentType:null, 
                    time: data.timestamp?new Date(data.timestamp*1000):0,
                    epochTime:data.timestamp,
                    cronType:"Collection on sale",
                    eventType:"collection-on-sale",
                    subGraphId:subGraphId
                })
            }
            
        }
        
    }catch(e){
        console.log("Collection on sale", e)
        Sentry.captureException(e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            return null;
        }else{
            return await historyCreate(obj, data, web3callcount);
        }
    }
   
}

const manageData = async (collectiondata) => {
    try{
        for (const data of collectiondata) {
            const nftContractAddress = data.nftContractAddress.toLowerCase()
            await updateCollection(nftContractAddress, data);
            await updateNfts(nftContractAddress, data);
            await historyCreate(nftContractAddress, data);
            await EventManager.updateOne({name:"collectionsale"}, {lastcrontime:data.timestamp})
        }
    }catch(e){
        Sentry.captureException(e)
        console.log("Collection on sale error", e)
    }
}

const collectionSalesEvent = async () => {
    let eventDetails = await EventManager.findOne({name:"collectionsale"})
    let from = 0;
    if(eventDetails){
       from = eventDetails.lastcrontime;
    }else{
        await EventManager.create({name:"collectionsale", lastcrontime:0})
    }

    try{
        let collectiondata = await collectionOnSaleQuery(from);
        if(collectiondata && collectiondata.length > 0){
            collectiondata = collectiondata.reverse();
            await manageData(collectiondata);
        }
    }catch(e){
        Sentry.captureException(e)
        console.error("collection on error", e)
    }
}
// collectionSalesEvent()

module.exports = {
    collectionSalesEvent
};
