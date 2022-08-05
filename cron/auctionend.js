const axios = require('axios');
const fs = require('fs')
const blueFiAbi = require("../config/bleufi.json")
const Web3 = require('web3')
const { Nfts, EventManager, Users, History } = require("../models");
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
const {createNft} = require("./createnft")
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
let DELAY_SECOUND = process.env.DELAY_SECOUND
let RE_TRY_FUNCTION = process.env.RE_TRY_FUNCTION
const {createUser} = require("./commanFunctions");
let RESERVE_MARKETPLACE = process.env.RESERVE_MARKETPLACE;
let FIXED_MARKETPLACE = process.env.FIXED_MARKETPLACE;

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}
//console.log("process.env.DB_URL", process.env.DB_URL)
mongoose.connect(process.env.DB_URL, ).then(() => {
  //logger.info('Connected to MongoDB');
}).catch((e) =>{
    console.log("error", e)
});

const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');

Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });


const auctionEndQuery = async (from, till) => {
    const url = SUB_GRAPH_URL;
    const query = {
        "query": `query MyQuery {\n  auctionFinisheds(\n    first: 50\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    winner\n    tokenId\n    nftContractAddress\n    timestamp\n    nftCreator\n  amount\n  }\n}`,
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
        return result.data.data.auctionFinisheds       
    }
    return []
};

const updateNftData = async (tokenId, obj, web3callcount=0) => {
    try{
        let contractaddress = obj.nftContractAddress;
        let nft = await Nfts.findOne({collectionAddress:contractaddress, tokenId:tokenId});
        if(nft){
            let updatedata = {
                owner:obj.winner,
                isSale:false,
                saleType:"Fixed",
                crontype:"auctionend",
                auctionStartTime: 0, 
                auctionLength: 0,
                auctionCreator: null, 
                auctionDuration: null,
                auctionInfo: null, 
                time:0
            }
            await Nfts.findOneAndUpdate({collectionAddress:contractaddress, tokenId:tokenId}, updatedata);
        }else{
            await createNft(tokenId, obj, contractaddress);
            let updatedata = {
                owner:obj.winner,
                isSale:false,
                saleType:"Fixed",
                crontype:"auctionend",
                auctionStartTime: 0, 
                auctionLength: 0,
                auctionCreator: null, 
                auctionDuration: null,
                auctionInfo: null,
                time:0
            }
            await Nfts.findOneAndUpdate({collectionAddress:contractaddress, tokenId:tokenId}, updatedata);
        }
        return true;
    }catch(e){
        Sentry.captureException(e)
        console.error("Auction end error")
        web3callcount++;
        console.log("web3callcount", web3callcount)
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            await EventManager.updateOne({name:"auctionend"}, {lastcrontime:obj.timestamp})
            return null;
        }else{
            return await updateNftData(tokenId, obj, web3callcount);
        }
    }
    
}

const historyCreate = async (obj) => {
    let user = await Users.findOne({account:obj.winner});
    if(!user){
        if(obj.winner.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
        && obj.winner.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
            user = await createUser(obj.winner);
        }
    }
    let olduser = await Users.findOne({account:obj.nftCreator});
    if(!olduser){
        if(obj.nftCreator.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
        && obj.nftCreator.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
            olduser = await createUser(obj.nftCreator);
        }
    }

    let nft = await Nfts.findOne({collectionAddress:obj.nftContractAddress, tokenId:obj.tokenId});
    let history = await History.findOne({subGraphId:obj.id});
    if(!history){
        await History.create({
            userId: user?user.id:null,
            oldUserId: olduser?olduser.id:null,
            nftId:nft?nft.id:null,
            actionType: 4, 
            price:obj?obj.amount:null, 
            paymentType:"BNB", 
            time: new Date(),
            epochTime:obj.timestamp,
            cronType:"auction end",
            subGraphId:obj.id
        })
    }
}

const manageData = async (onsaledata) => {    
    try{
        for (const data of onsaledata) { 
            let tokenId = data.tokenId;
            if(tokenId){
                let result = await updateNftData(tokenId, data)
                if(result){
                    await historyCreate(data)
                }
            }
            await EventManager.updateOne({name:"auctionend"}, {lastcrontime:data.timestamp})
        }
    }catch(e){
        console.error("Aucation end", e)
        Sentry.captureException(e)
    } 
}

const auctionEnd = async () => {
    let eventDetails = await EventManager.findOne({name:"auctionend"})
    let from = 0
    if(eventDetails){
        from = eventDetails.lastcrontime;        
    }else{
        await EventManager.create({name:"auctionend", lastcrontime:0})
    }

    try{
        let auctiondata = await auctionEndQuery(from);
        if(auctiondata && auctiondata.length > 0){
            auctiondata = auctiondata.reverse();
            await manageData(auctiondata);
        }
    }catch(e){
        console.error("Aucation end", e)
        Sentry.captureException(e)
    }

}

// auctionEnd()
module.exports = {
    auctionEnd
};
