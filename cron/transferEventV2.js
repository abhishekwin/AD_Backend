const axios = require('axios');
const Web3 = require('web3')
const { Nfts, EventManager, CollectionNFTs, History, Users } = require("../models");
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
const blueFiAbi = require("../config/bleufi.json");
const BLEUFI_NFT = process.env.BLEUFI_NFT;
const COLLECTION_FACTORY = process.env.COLLECTION_FACTORY;
let FIXED_MARKETPLACE = process.env.FIXED_MARKETPLACE;
let RESERVE_MARKETPLACE = process.env.RESERVE_MARKETPLACE;
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL_V2 = process.env.SUB_GRAPH_URL_V2
let DELAY_SECOUND = process.env.DELAY_SECOUND
let RE_TRY_FUNCTION = process.env.RE_TRY_FUNCTION

const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');
const { remove } = require('../models/collectionNFTsModel');
const helpers = require("../helpers/helper");
const { json } = require('express/lib/response');
const { consoleSandbox } = require('@sentry/utils');
const {createUser} = require("./commanFunctions");
Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });
//console.log("process.env.DB_URL", process.env.DB_URL)
mongoose.connect(process.env.DB_URL, ).then(() => {
  //logger.info('Connected to MongoDB');
}).catch((e) =>{
    console.log("error", e)
});



const transferFunctionQuery = async (from) => {
    if(!SUB_GRAPH_URL_V2){
        return
    }
    const url = SUB_GRAPH_URL_V2;
    const query = {
        "query": `query MyQuery {\n  nftTransfers(\n    first: 100\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    id\n    to\n    timestamp\n    from\n    collection_address\n    tokenId\n  }\n}`,
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
        return result.data.data.nftTransfers       
    }
    return []
};

const getTransferWebData = async (url) => {
    const result = await axios.get(url);
    if(result.status == 200){
        return result.data;
    }
    return null
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const webTransferFunction = async (id, collection_id, web3callcount) => {

    try{
        const  web3 = new Web3(WEB3_URL)
        const contractInstance = new web3.eth.Contract(blueFiAbi.abi, collection_id)
        let tokenURI = await contractInstance.methods.tokenURI(id).call()
        return tokenURI;
    }catch(e){
       // console.log("Web-Transfer-Function", e)
        Sentry.captureException(e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            return null;
        }else{
            return await webTransferFunction (id, collection_id, web3callcount);
        }
    }    
}


const prepareData = async (tokenId, obj, collection_id,  web3callcount=0) => {  
    try{
        let collection_id = obj.collection_address;  
        let webdataurl = await webTransferFunction(tokenId, collection_id, web3callcount);
        let web3data = await getTransferWebData(webdataurl);  
        if(web3data){
            obj = {...obj, ...web3data}     
            let nftdata = {
                collectionAddress: collection_id,
                tokenId:obj.tokenId?obj.tokenId:null,
                tokenURI:webdataurl,
                owner:obj.to,
                creator:obj.creator,
                time:0,
                type:obj.type,
                category:obj.category,
                name:obj.name,
                description:obj.description,
                royalties:obj.royalties,
                to:obj.to,
                from:obj.from,
                timestamp:obj.timestamp,
                isSale:false
            }            
            return nftdata;
        }else{
            console.error("Treansfer web 3 data Not Found")
            Sentry.captureException(e)
        }          
    }catch(e){
        //console.error("Treansfer catch error", e)
        Sentry.captureException(e) 
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            await EventManager.updateOne({name:"transfer"}, {lastcrontime:obj.timestamp})
        }else{
            return await prepareData(tokenId, obj, collection_id, web3callcount);
        }       
    }    
}
    
const createNftData = async (tokenId, obj, isSale, web3callcount=0) => {
    try{
        let collection_id = obj.collection_address;
        let nft = await Nfts.findOne({collectionAddress:collection_id, tokenId:tokenId});
        if(!nft){
            
            let data = await prepareData(tokenId, obj, collection_id);
            if(data){
                data.crontype="createtransfer"
                data.isSale= isSale
                data.id=obj.id
                await Nfts.create(data);  
            }           
                      
        }else{
            let data = await prepareData(tokenId, obj, collection_id);
                if(data){
                    await Nfts.findOneAndUpdate({collectionAddress:collection_id, tokenId:tokenId}, data);
                }
            //await helpers.writeFileAndAppendData(JSON.stringify({date:new Date(), type:"update nft", data}))
            }
    }catch(e){
        console.log("Transfer error data", e)
        Sentry.captureException(e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            return null;
        }else{
            return await createNftData (tokenId, obj, isSale, web3callcount);
        }
    }
         
}

const historyCreate = async (obj, web3callcount=0) => {
    
    try{
        let collectionAddress = obj.collection_address
        let user = await Users.findOne({account:obj.to});
        if(!user){
            if(obj.from != "0x0000000000000000000000000000000000000000" 
            && obj.from.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
            && obj.from.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
                user = await createUser(obj.to);
            }
        }
        let olduser = await Users.findOne({account:obj.from});
        if(!olduser){
            if(obj.from != "0x0000000000000000000000000000000000000000" 
            && obj.from.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
            && obj.from.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
                olduser = await createUser(obj.from);
            }
        }
        let nft = await Nfts.findOne({collectionAddress:collectionAddress, tokenId:obj.tokenId});
        if(nft){
            let history = await History.findOne({subGraphId:obj.id});
            if(!history){
                
                if(obj.to.toLowerCase() != FIXED_MARKETPLACE.toLowerCase() && obj.from.toLowerCase() != FIXED_MARKETPLACE.toLowerCase())
                {
                    let historywithNft = await History.findOne({nftId:nft.id, actionType: 0});
                    if(!historywithNft){
                        await History.create({
                            userId: user?user.id:null,
                            oldUserId: olduser?olduser.id:null,
                            nftId:nft?nft.id:null,
                            actionType: 0, 
                            price:nft?nft.price:0, 
                            paymentType:null, 
                            time: obj.timestamp?new Date(obj.timestamp*1000):0,
                            epochTime:obj.timestamp,
                            cronType:"Transfer event",
                            eventType:"transfer-create-history",
                            subGraphId:obj.id
                        })
                    }
                }
            }
        }
        
    }catch(e){
        console.log("Transfer error history", e)
        Sentry.captureException(e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            return null;
        }else{
            return await historyCreate(obj, web3callcount);
        }
    }
   
}

const historyCreateForNftUpdate = async (obj, web3callcount=0) => {
    try{
        let collectionAddress = obj.collection_address
        let user = await Users.findOne({account:obj.to});
        if(!user){
            if(obj.to != "0x0000000000000000000000000000000000000000" 
            && obj.to.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
            && obj.to.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
                user = await createUser(obj.to);
            }
        }
        let olduser = await Users.findOne({account:obj.from});
        if(!olduser){
            if(obj.from != "0x0000000000000000000000000000000000000000" 
            && obj.from.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
            && obj.from.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
                olduser = await createUser(obj.from);
            }
        }
        let nft = await Nfts.findOne({collectionAddress:collectionAddress, tokenId:obj.tokenId});
        let history = await History.findOne({subGraphId:obj.id});
        if(!history){
            
            if(obj.to.toLowerCase() != FIXED_MARKETPLACE.toLowerCase() && obj.from.toLowerCase() != FIXED_MARKETPLACE.toLowerCase())
            {
                await History.create({
                    userId: user?user.id:null,
                    oldUserId: olduser?olduser.id:null,
                    nftId:nft?nft.id:null,
                    actionType: 1, 
                    price:nft?nft.price:0,  
                    paymentType:null, 
                    time: obj.timestamp?new Date(obj.timestamp*1000):0,
                    epochTime:obj.timestamp,
                    cronType:"Transfer event",
                    eventType:"transfer-update-history",
                    subGraphId:obj.id
                }) 
            }            
        }
    }catch(e){
        console.log("Transfer error history for nft", e)
        Sentry.captureException(e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            return null;
        }else{
            return await historyCreateForNftUpdate(obj, web3callcount);
        }
    }
   
}

const updateNftData = async (tokenId, obj, web3callcount) => { 
    try{
        let collection_id = obj.collection_address;
        let nft = await Nfts.findOne({collectionAddress:collection_id, tokenId:tokenId});
        if(nft){
            await Nfts.findOneAndUpdate({collectionAddress:collection_id, tokenId:tokenId}, {owner:obj.to, isFirstSale:false, isSale:false, crontype:"updatetransfer"});
            let data = await prepareData(tokenId, obj);
            //await helpers.writeFileAndAppendData(JSON.stringify({date:new Date(), type:"update check nft", data}))
        }
    }catch(e){
        console.log("Transfer error update", e)
        Sentry.captureException(e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            return null;
        }else{
            return await updateNftData(tokenId, obj, web3callcount);
        }
    }
      
}


const updateNftUsingNonceData = async (tokenId, obj, web3callcount, nftNonce) => { 
    try{
        let collection_id = obj.collection_address;
        let nft = await Nfts.findOne({collectionAddress:collection_id, nonce:nftNonce});
        if(nft){
            await Nfts.findOneAndUpdate({collectionAddress:collection_id, nonce:nftNonce}, {tokenId:tokenId, owner:obj.to, isFirstSale:false, isSale:false, crontype:"updatetransfer"});
            let data = await prepareData(tokenId, obj);
            //await helpers.writeFileAndAppendData(JSON.stringify({date:new Date(), type:"update check nft", data}))
        }
    }catch(e){
        console.log("Transfer error nonce", e)
        Sentry.captureException(e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            return null;
        }else{
            return await updateNftUsingNonceData(tokenId, obj, web3callcount, nftNonce);
        }
    }
      
}

const manageData = async (transferdata, web3callcount = 0) => {    
    for (const data of transferdata) {
        
        try{
            let tokenId = data.tokenId; 
            if(data.from == "0x0000000000000000000000000000000000000000"){ 
                const  web3 = new Web3(WEB3_URL)                
                let contractInstance = new web3.eth.Contract(blueFiAbi.abi,BLEUFI_NFT)
                let tokenToNonce = await contractInstance.methods.tokenToNonce(tokenId).call()
                let nftNonce =null;
                
                if(tokenToNonce > 0){
                    nftNonce = await Nfts.findOne({collectionAddress:BLEUFI_NFT,  nonce:tokenToNonce});            
                }
                
                if(nftNonce == null){
                    await createNftData(tokenId, data, false)
                    await historyCreate(data) 
                }else{
                    nftNonce = nftNonce.nonce;
                    await updateNftUsingNonceData(tokenId, data, false, nftNonce)
                }
                
                
            }
            else if(data.to.toLowerCase() == RESERVE_MARKETPLACE.toLowerCase() || data.to.toLowerCase() == FIXED_MARKETPLACE.toLowerCase()){
                let nft = await Nfts.findOne({collectionAddress:data.collection_address, tokenId:tokenId});
                if(!nft) {     
                    data.to = data.from;
                    await createNftData(tokenId, data, false)
                    await historyCreate(data)
                }
            }
            else{                
                await updateNftData(tokenId, data, false)
                await historyCreateForNftUpdate(data)                
            }

            let collection_id = data.collection_address;
            let nftdetails = await Nfts.findOne({collectionAddress:collection_id, tokenId:tokenId}).sort({updatedAt:-1});
            if(nftdetails){
                await Nfts.deleteMany({_id:{$ne:nftdetails._id}, collectionAddress:collection_id, tokenId:tokenId })
            }            
            await EventManager.updateOne({name:"transfer"}, {lastcrontime:data.timestamp})                      
             
        }catch(e){
            console.log("Transfer error manage data", e)
            Sentry.captureException(e)
            web3callcount++;
            await sleep(DELAY_SECOUND);
            if(web3callcount > RE_TRY_FUNCTION){
                await EventManager.updateOne({name:"transfer"}, {lastcrontime:data.timestamp})
                return null;
            }else{
                return await manageData(transferdata, web3callcount);
            }
        }       
    }
}

const getTransferFunction = async (web3callcount = 0) => {
    let transfereventDetails = await EventManager.findOne({name:"transfer"})
    let from = 0
    if(transfereventDetails){
       from = transfereventDetails.lastcrontime;
    }else{
        await EventManager.create({name:"transfer", lastcrontime:0})
    }
   
    try{
        let transferdata = await transferFunctionQuery(from);
        if(transferdata && transferdata.length > 0){
            transferdata = transferdata.reverse();
            await manageData(transferdata);
        }
    }catch(e){
        console.log("Transfer v2 failed", e)
        Sentry.captureException(e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > RE_TRY_FUNCTION){
            return null;
        }else{
            return await getTransferFunction (web3callcount);
        }
    }
}

// getTransferFunction();

module.exports = {
    getTransferFunction
};