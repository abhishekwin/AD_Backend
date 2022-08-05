const axios = require('axios');
const fs = require('fs')
const blueFiAbi = require("../config/bleufi.json")
const Web3 = require('web3')
const { Nfts, EventManager, Users, History } = require("../models");
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');
Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });
const {createNft} = require("./createnft")
const {createUser} = require("./commanFunctions");
let FIXED_MARKETPLACE = process.env.FIXED_MARKETPLACE;
let RESERVE_MARKETPLACE = process.env.RESERVE_MARKETPLACE;

mongoose.connect(process.env.DB_URL, ).then(() => {
  //logger.info('Connected to MongoDB');
}).catch((e) =>{
    console.log("error", e)
});

const soldQuery = async (from) => {
    const url = SUB_GRAPH_URL;
    const query = {
        "query": `query MyQuery {\n  marketSolds(\n    first: 50\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    nftContractAddress\n    owner\n    price\n    timestamp\n    tokenId\n    buyer\n  }\n}`,
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
        return result.data.data.marketSolds       
    }
    return []
};

const updateNftData = async (tokenId, obj) => {
    try{
        let user = await Users.findOne({account:obj.buyer});
        let contractaddress = obj.nftContractAddress;
        let nft = await Nfts.findOne({collectionAddress:contractaddress, tokenId:tokenId});
        if(nft){
            let updatedata = {
                owner:obj.buyer,
                isSale:false,
                price:obj.price,
                saleType:"Fixed",
                crontype:"auSUB_GRAPH_URLctiononsold"
            }
            await Nfts.findOneAndUpdate({collectionAddress:contractaddress, tokenId:tokenId}, updatedata);
        }else{
            await createNft(tokenId, obj, contractaddress);
            let updatedata = {
                owner:obj.buyer,
                isSale:false,
                price:obj.price,
                saleType:"Fixed",
                crontype:"auctiononsold"
            }
            await Nfts.findOneAndUpdate({collectionAddress:contractaddress, tokenId:tokenId}, updatedata);
        }
        return true;
    }catch(e){
        console.error("Market on sold error", e)
        Sentry.captureException(e)
        await EventManager.updateOne({name:"sold"}, {lastcrontime:obj.timestamp}) 
    }
    
}

const historyCreate = async (obj) => {
    let user = await Users.findOne({account:obj.buyer});
    if(!user){
        if(
            obj.owner.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
        && obj.owner.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
            user = await createUser(obj.owner);
        }
    }
    let olduser = await Users.findOne({account:obj.owner});
    let nft = await Nfts.findOne({collectionAddress:obj.nftContractAddress, tokenId:obj.tokenId});    
    let history = await History.findOne({subGraphId:obj.id});
    if(!history){
        await History.create({
            userId: user?user._id:null,
            oldUserId: olduser?olduser._id:null,
            nftId:nft?nft.id:null,
            actionType: 1, 
            price:obj?obj.price:0, 
            paymentType:"BNB", 
            time: new Date(),
            epochTime:obj.timestamp,
            cronType:"market on sold",
            subGraphId:obj.id
        })
    }
}

const manageData = async (onsaledata) => {    
    try{
        for (const data of onsaledata) { 
            let tokenId = data.tokenId;
            if(tokenId){
                let result = await updateNftData(tokenId, data);
                // if(result){
                //     await historyCreate(data)
                // }
            }
            await EventManager.updateOne({name:"sold"}, {lastcrontime:data.timestamp})
        }
    }catch(e){
        console.log("Market on sold", e)
        Sentry.captureException(e)
    } 
}

const sold = async () => {
    
    let eventDetails = await EventManager.findOne({name:"sold"})
    let from = 0
    if(eventDetails){
        from = eventDetails.lastcrontime;        
    }else{
        await EventManager.create({name:"sold", lastcrontime:0})
    }

    try{
        let querydata = await soldQuery(from);
        if(querydata && querydata.length > 0){
            querydata = querydata.reverse();
            await manageData(querydata);
        }
    }catch(e){
        console.log("On sold error", e)
        Sentry.captureException(e)
    } 
}

// sold()
module.exports = {
    sold
};