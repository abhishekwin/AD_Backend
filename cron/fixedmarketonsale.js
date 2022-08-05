const axios = require('axios');
const fs = require('fs')
const blueFiAbi = require("../config/bleufi.json")
const Web3 = require('web3')
const { Nfts, EventManager,  History, Users} = require("../models");
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
const {createNft} = require("./createnft")
const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');
const helpers = require("../helpers/helper");
Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });

const {createUser} = require("./commanFunctions");
let FIXED_MARKETPLACE = process.env.FIXED_MARKETPLACE;
let RESERVE_MARKETPLACE = process.env.RESERVE_MARKETPLACE;

mongoose.connect(process.env.DB_URL, ).then(() => {
  //logger.info('Connected to MongoDB');
}).catch((e) =>{
    console.log("error", e)
});

const onSaleQuery = async (from) => {
    const url = SUB_GRAPH_URL;
    const query = {
        "query": `query MyQuery {\n  marketOnSales(\n    first: 50\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    nftContractAddress\n    tokenId\n    owner\n  price\n    timestamp\n    }\n}`,
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
        return result.data.data.marketOnSales       
    }
    return []
};

const updateNftData = async (tokenId, obj) => {
    try{
        let contractaddress = obj.nftContractAddress;
        let nft = await Nfts.findOne({collectionAddress:contractaddress, tokenId:tokenId});
        if(nft){
            let updatedata = {
                isSale:true,
                price:obj.price,
                saleType:"Fixed",
                crontype:"auctiononsale"
            }
           // await helpers.writeFileAndAppendData(JSON.stringify({date:new Date(), type:"Market on sale", updatedata, obj}))
            
            await Nfts.findOneAndUpdate({collectionAddress:contractaddress, tokenId:tokenId}, updatedata);
        }else{
            await createNft(tokenId, obj, contractaddress);
            let updatedata = {
                isSale:true,
                price:obj.price,
                saleType:"Fixed",
                crontype:"auctiononsale"
            }
            //await helpers.writeFileAndAppendData(JSON.stringify({date:new Date(), type:"Market on sale create and update", updatedata, obj}))
            await Nfts.findOneAndUpdate({collectionAddress:contractaddress, tokenId:tokenId}, updatedata);
        }
        return true;
    }catch(e){
        console.error("On sale error", e)
        Sentry.captureException(e)
        await EventManager.updateOne({name:"onsale"}, {lastcrontime:obj.timestamp})
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
    let nft = await Nfts.findOne({collectionAddress:obj.nftContractAddress, tokenId:obj.tokenId});
    let history = await History.findOne({subGraphId:obj.id});
    if(!history){
        await History.create({
            userId: user?user._id:null,
            oldUserId: null,
            nftId:nft?nft.id:null,
            actionType: 6, 
            price:obj.price, 
            paymentType:"BNB", 
            time: new Date(),
            epochTime:obj.timestamp,
            cronType:"market on sale",
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
            
            await EventManager.updateOne({name:"onsale"}, {lastcrontime:data.timestamp}) 
        }
    }catch(e){
        console.error("On sale error", e)
        Sentry.captureException(e)
    } 
}

const onSale = async () => {
    let eventDetails = await EventManager.findOne({name:"onsale"})
    let from = 0
    if(eventDetails){
        from = eventDetails.lastcrontime;
    }else{
        await EventManager.create({name:"onsale", lastcrontime:0})
    }

    try{
        let querydata = await onSaleQuery(from);
        if(querydata && querydata.length > 0){
            querydata = querydata.reverse();
            await manageData(querydata);               
        }
    }catch(e){
        console.error("Market on sale faile", e)
        Sentry.captureException(e)
    } 
}
onSale();
module.exports = {
    onSale
};
