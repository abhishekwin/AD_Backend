const axios = require('axios');
const fs = require('fs')
const blueFiAbi = require("../config/bleufi.json")
const Web3 = require('web3')
const { Nfts, EventManager, Users, History } = require("../models");
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
//console.log("process.env.DB_URL", process.env.DB_URL)
const {createNft} = require("./createnft")
const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');
let DELAY_SECOUND = process.env.DELAY_SECOUND
let RE_TRY_FUNCTION = process.env.RE_TRY_FUNCTION
const helpers = require("../helpers/helper");
Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });

const {createUser} = require("./commanFunctions");
let RESERVE_MARKETPLACE = process.env.RESERVE_MARKETPLACE;
let FIXED_MARKETPLACE = process.env.FIXED_MARKETPLACE;

mongoose.connect(process.env.DB_URL, ).then(() => {
  //logger.info('Connected to MongoDB');
}).catch((e) =>{
    console.log("error", e)
});

const auctionCreateQuery = async (from) => {
    const url = SUB_GRAPH_URL;
    const query = {
        "query": `query MyQuery {\n  auctions(\n    first: 50\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n   tokenId\n    reservePrice\n    duration\n    auctionStart\n  nftContractAddress\n  fundsRecipient\n  timestamp\n }\n}`,
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
        return result.data.data.auctions       
    }
    return []
};

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const updateNftData = async (tokenId, obj, web3callcount=0) => {
    try{
        let contractaddress = obj.nftContractAddress;
        let nft = await Nfts.findOne({collectionAddress:contractaddress, tokenId:tokenId});
        if(nft){
            let updatedata = {
                auctionStartTime:obj.auctionStart,
                auctionDuration:obj.duration,
                price:obj.reservePrice,
                isSale:true,
                saleType:"Auction",
                crontype:"auctioncreate"
            }
           // await helpers.writeFileAndAppendData(JSON.stringify({date:new Date(), type:"Auction  create", updatedata}))
            await Nfts.findOneAndUpdate({collectionAddress:contractaddress, tokenId:tokenId}, updatedata);
        }else{
            await createNft(tokenId, obj, contractaddress);
            
            let updatedata = {
                auctionStartTime:obj.auctionStart,
                auctionDuration:obj.duration,
                price:obj.reservePrice,
                isSale:true,
                saleType:"Auction",
                crontype:"auctioncreate"
            }
            //await helpers.writeFileAndAppendData(JSON.stringify({date:new Date(), type:"Auction  create and update", updatedata}))
            await Nfts.findOneAndUpdate({collectionAddress:contractaddress, tokenId:tokenId}, updatedata);
                       
        }
        return true
    }catch(e){
        console.error("Auction create error", e)
        Sentry.captureException(e)
        web3callcount++;
        console.log("web3callcount", web3callcount)
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            await EventManager.updateOne({name:"auctioncreate"}, {lastcrontime:obj.timestamp})
            return null;
        }else{
            return await updateNftData(tokenId, obj, web3callcount);
        }
    }
   
}

const historyCreate = async (obj) => {
    let user = await Users.findOne({account:obj.fundsRecipient});
    if(!user){
        if(obj.fundsRecipient.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
        && obj.fundsRecipient.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
            user = await createUser(obj.fundsRecipient);
        }
    }
    let nft = await Nfts.findOne({collectionAddress:obj.nftContractAddress, tokenId:obj.tokenId});
    let history = await History.findOne({subGraphId:obj.id});
    if(!history){
         await History.create({
            userId: user?user._id:null,
            oldUserId: null,
            nftId:nft?nft.id:null,
            actionType: 3, 
            price:obj?obj.reservePrice:null, 
            paymentType:"BNB", 
            time: new Date(),
            epochTime:obj.timestamp,
            cronType:"auction create",
            subGraphId:obj.id
        })
    }
    
}

const manageData = async (onsaledata) => {    
    try{
        for (const data of onsaledata) { 
            let tokenId = data.tokenId;
            data.nftContractAddress = data.nftContractAddress.toLowerCase()
            data.fundsRecipient = data.fundsRecipient.toLowerCase()
            if(tokenId){
                let result = await updateNftData(tokenId, data)
                if(result){
                    await historyCreate(data)
                }
            }
            await EventManager.updateOne({name:"auctioncreate"}, {lastcrontime:data.timestamp})
        }
    }catch(e){
        console.error("Auction create error", e)
        Sentry.captureException(e)
       
    } 
}

const auctionCreate = async () => {
    let eventDetails = await EventManager.findOne({name:"auctioncreate"})
    let from = 0
    
    if(eventDetails){
        from = eventDetails.lastcrontime;        
    }else{
        await EventManager.create({name:"auctioncreate", lastcrontime:0})
    }

    try{
        let auctiondata = await auctionCreateQuery(from);
        if(auctiondata && auctiondata.length > 0){
            auctiondata = auctiondata.reverse();
            await manageData(auctiondata);            
        }
    }catch(e){
        Sentry.captureException(e)
        console.error("Auction create faild", e)
    }
}

// auctionCreate()

module.exports = {
    auctionCreate
};

