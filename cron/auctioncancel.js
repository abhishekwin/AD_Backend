const axios = require('axios');
const Web3 = require('web3')
const { Nfts, EventManager, CollectionNFTs, History, Users } = require("../models");
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
const blueFiAbi = require("../config/bleufi.json");
const BLEUFI_NFT = process.env.BLEUFI_NFT;
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
const {createNft} = require("./createnft")
let DELAY_SECOUND = process.env.DELAY_SECOUND
let RE_TRY_FUNCTION = process.env.RE_TRY_FUNCTION
const {createUser} = require("./commanFunctions");
let RESERVE_MARKETPLACE = process.env.RESERVE_MARKETPLACE;
let FIXED_MARKETPLACE = process.env.FIXED_MARKETPLACE;
mongoose.connect(process.env.DB_URL, ).then(() => {
  //logger.info('Connected to MongoDB');
}).catch((e) =>{
    console.log("error", e)
});
const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');

Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });

const auctionCancelFunction = async (from, till) => {
    const url = SUB_GRAPH_URL;
    const query = {
        "query": `query MyQuery {\n  auctionCancels(\n    first: 50\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    tokenId\n    nftContractAddress\n    owner\n    timestamp\n  }\n}`,
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

    const result = await axios.post(url, query, config).catch((e)=>{
        console.log("error", e)
    });
    
    if(result.status == 200 && result.data && result.data.data){
        return result.data.data.auctionCancels       
    }
    return []
};

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const updateNftData = async (tokenId, obj, web3callcount=0) => {
    //console.log("obj", obj)
    try{
        let contractaddress = obj.nftContractAddress;
        let nft = await Nfts.findOne({collectionAddress:contractaddress, tokenId:tokenId});
        if(nft){
            let updatedata = {
                isSale:false,
                saleType:"Fixed",
                crontype:"auctioncancel",
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
                isSale:false,
                saleType:"Fixed",
                crontype:"auctioncancel",
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
        console.log("Auction bid error", e)
        web3callcount++;
        console.log("web3callcount", web3callcount)
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            await EventManager.updateOne({name:"auctioncancel"}, {lastcrontime:obj.timestamp})
            return null;
        }else{
            return await updateNftData(tokenId, obj, web3callcount);
        }
    }
    
}

const historyCreate = async (obj) => {
    let user = await Users.findOne({account:obj.owner});
    if(!user){
        if(obj.owner.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
        && obj.owner.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
            user = await createUser(obj.owner);
        }
    }
    // let olduser = await Users.findOne({account:obj.curator});
    let nft = await Nfts.findOne({collectionAddress:obj.nftContractAddress, tokenId:obj.tokenId});
    let history = await History.findOne({subGraphId:obj.id});
    if(!history){
        await History.create({
            userId: user?user.id:null,
            //oldUserId: olduser?olduser.id:null,
            nftId:nft?nft.id:null,
            actionType: 5, 
            price:nft?nft.price:0,  
            paymentType:"BNB", 
            time: new Date(),
            epochTime:obj.timestamp,
            cronType:"auction cancel",
            subGraphId:obj.id
        })
    }
    
}

const manageData = async (onsaledata) => {    
    try{
        for (const data of onsaledata) { 
            data.nftContractAddress = data.nftContractAddress.toLowerCase()
            data.owner = data.owner.toLowerCase()
            let tokenId = data.tokenId;
            if(tokenId){
                let result = await updateNftData(tokenId, data)
                if(result){
                    await historyCreate(data)
                }
            }
            await EventManager.updateOne({name:"auctioncancel"}, {lastcrontime:data.timestamp})  
        }
    }catch(e){
        Sentry.captureException(e)
        console.log("Auction cancel error 2", e)
    } 
}

const auctionCancel = async () => {
    let eventDetails = await EventManager.findOne({name:"auctioncancel"})
    let from = 0
    if(eventDetails){
        from = eventDetails.lastcrontime;
    }else{
        await EventManager.create({name:"auctioncancel", lastcrontime:0})
    }

    try{
        let auctioncancel = await auctionCancelFunction(from);
        if(auctioncancel && auctioncancel.length > 0 ){
            auctioncancel = auctioncancel.reverse();
            await manageData(auctioncancel);  
        }
    }catch(e){
        console.log("Auction cancel error 3", e)
        Sentry.captureException(e)
    }
    
}

// auctionCancel()

module.exports = {
    auctionCancel
};
