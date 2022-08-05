const axios = require('axios');
const fs = require('fs')
const blueFiAbi = require("../config/bleufi.json")
const reserveAuction = require("../config/reserveAuction.json")

const Web3 = require('web3')
const { Nfts, EventManager, Bid, Users, History } = require("../models");
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
const {createNft} = require("./createnft")
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
let DELAY_SECOUND = process.env.DELAY_SECOUND
let RE_TRY_FUNCTION = process.env.RE_TRY_FUNCTION
let RESERVE_MARKETPLACE = process.env.RESERVE_MARKETPLACE;
const {createUser} = require("./commanFunctions");
let FIXED_MARKETPLACE = process.env.FIXED_MARKETPLACE;
//console.log("process.env.DB_URL", process.env.DB_URL)
mongoose.connect(process.env.DB_URL, ).then(() => {
  //logger.info('Connected to MongoDB');
}).catch((e) =>{
    console.log("error", e)
});

const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');

Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });

const auctionBidQuery = async (from, till) => {
    const url = SUB_GRAPH_URL;
    const query = {
        "query": `query MyQuery {\n  bids(\n    first: 50\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    nftContractAddress\n    tokenId\n    value\n    sender\n  timestamp\n}\n}`,
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
        return result.data.data.bids       
    }
    return []
};

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const webTransferFunction = async (tokenId, collectionAddress, obj, web3callcount) => {

    try{
        const  web3 = new Web3(WEB3_URL)
        const contractInstance = new web3.eth.Contract(reserveAuction.abi, RESERVE_MARKETPLACE)
        let auctionInfo = await contractInstance.methods.auctions(collectionAddress, tokenId).call();
        return auctionInfo;
    }catch(e){
        Sentry.captureException(e)
        console.log("Auction bid error", e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            return null;
        }else{
            return await webTransferFunction (tokenId, collectionAddress, obj, web3callcount);
        }
    }
    
    
}

const createNftBid = async (tokenId, obj, web3callcount=0) => {
    try{
        let auctionInfo = await webTransferFunction(tokenId, obj.nftContractAddress, obj, web3callcount);       
        
        let user = await Users.findOne({account:obj.sender});
        if(!user){
            if(obj.sender.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
            && obj.sender.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
                user = await createUser(obj.sender);
            }
        }
        let nft = await Nfts.findOne({collectionAddress:obj.nftContractAddress, tokenId:tokenId});
        if(user && nft){
            let bid = await Bid.findOne({userId:user.id, nftId:nft.id, strtimestamps:obj.timestamp})
            if(!bid){
                await Bid.create({
                    userId:user?user.id:null,
                    nftId:user?nft.id:null ,
                    value:obj?obj.value:null,
                    strtimestamps:obj?obj.timestamp:null,       
                })
            }
            if(!auctionInfo){
                console.error("Auction Info Not Found")
                return await EventManager.updateOne({name:"auctionbid"}, {lastcrontime:obj.timestamp})
            }
            await Nfts.findOneAndUpdate({_id:nft.id}, {
                auctionInfo: auctionInfo.bidder,
                time:
                    (parseInt(auctionInfo.duration) +
                    parseInt(auctionInfo.firstBidTime)) *
                    1000,
                price:auctionInfo.amount,
                crontype:"bid"
            });
        }
        return true
    }catch(e){
        Sentry.captureException(e)
        console.log("Auction bid error", e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            await EventManager.updateOne({name:"auctionbid"}, {lastcrontime:obj.timestamp})
            return null;
        }else{
            return await createNftBid(tokenId, obj, web3callcount);
        }
    }
    
}

const historyCreate = async (obj) => {
    let user = await Users.findOne({account:obj.sender});
    let nft = await Nfts.findOne({collectionAddress:obj.nftContractAddress, tokenId:obj.tokenId});
    let history = await History.findOne({subGraphId:obj.id});
    if(!history){
        await History.create({
            userId: user?user.id:null,
            //oldUserId: olduser?olduser.id:null,
            nftId:nft?nft.id:null,
            actionType: 2, 
            price:obj?obj.value:null, 
            paymentType:"BNB", 
            time: new Date(),
            epochTime:obj.timestamp,
            cronType:"auction bid",
            subGraphId:obj.id
        })
    }
    
}

const manageData = async (onsaledata) => {    
    try{
        for (const data of onsaledata) { 
            data.nftContractAddress = data.nftContractAddress.toLowerCase()
            data.sender = data.sender.toLowerCase()
            let tokenId = data.tokenId;
            if(tokenId){
                let result = await createNftBid(tokenId, data)
                if(result){
                    await historyCreate(data)
                    await EventManager.updateOne({name:"auctionbid"}, {lastcrontime:data.timestamp})
                }
            }
        }
    }catch(e){
        Sentry.captureException(e)
        console.log("Auction bid error", e)
    } 
}

const auctionBid = async () => {
    let eventDetails = await EventManager.findOne({name:"auctionbid"})
    let from = 0;

    if(eventDetails){
        from = eventDetails.lastcrontime;        
    }else{
        await EventManager.create({name:"auctionbid", lastcrontime:0})
    }
    
    try{        
        let auctiondata = await auctionBidQuery(from);
        if(auctiondata && auctiondata.length > 0){
            auctiondata = auctiondata.reverse();
            await manageData(auctiondata);           
        }
    }catch(e){
        Sentry.captureException(e)
        console.error("Auction bid", e)
    }    
}
// auctionBid()

module.exports = {
    auctionBid
};
