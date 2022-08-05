const axios = require('axios');
const fs = require('fs')
const blueFiAbi = require("../config/bleufi.json")
const Web3 = require('web3')
const { Nfts, EventManager, CollectionNFTs, History, Users } = require("../models");
const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
let DELAY_SECOUND = process.env.DELAY_SECOUND

mongoose.connect(process.env.DB_URL, ).then(() => {
  //logger.info('Connected to MongoDB');
}).catch((e) =>{
    console.log("error", e)
});

const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');

Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });

// {
//     collectionAddress: '0x348B405933efD67639628122c68F1728837df3A7',
//     tokenId: '110',
//     tokenURI: 'https://ipfs.io/ipfs/bafybeiergf7wmgbugped2h4mqwzwwebr22beha2gkzbksqqkmbgkozfo6a/metadata.json',
//     owner: '0xa155d12c5ab84b9b8b6a1cc714cfe911e29f6d9b',
//     creator: '0xa155D12C5AB84b9b8B6A1cC714cfE911e29f6D9b',
//     time: '2022-03-22 05:15:20',
//     type: 'image',
//     category: 'art',
//     name: 'Normal Mint',
//     description: 'NMMNM',
//     royalties: 7
// }

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const webTransferFunction = async (id, collection_id, web3callcount = 0)  => {

    try{
        const  web3 = new Web3(WEB3_URL)
        const contractInstance = new web3.eth.Contract(blueFiAbi.abi, collection_id)
        let tokenURI = await contractInstance.methods.tokenURI(id).call()
        return tokenURI;
    }catch(e){
        Sentry.captureException(e)
        console.error("Create error", e)
        web3callcount++;
        await sleep(DELAY_SECOUND);
        if(web3callcount > 3){
            return null;
        }else{
            return await webTransferFunction (id, collection_id, web3callcount);
        }
    }   
}

const getTransferWebData = async (url) => {
    const result = await axios.get(url);
    if(result.status == 200){
        return result.data;
    }
    return null
}

const prepareData = async (tokenId, obj, collection_id) => {
    let webdataurl = await webTransferFunction(tokenId, collection_id); 
    if(webdataurl){
        let web3data = await getTransferWebData(webdataurl);              
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
            from:obj.from
        }
        return nftdata;
    }else{
        console.error("webdataurl not found")
    }             
    
}
    
const createNftData = async (tokenId, obj, collection_id) => {
    let nft = await Nfts.findOne({collectionAddress:collection_id, tokenId:tokenId});
    if(!nft && collection_id){
        try{
            let data = await prepareData(tokenId, obj, collection_id);
            await Nfts.create(data); 
        }catch(e){
            Sentry.captureException(e)
            console.error("Common create nft error", e)
        }        
    }     
}

const createNft = async (tokenId, obj, collection_id) => {  
    await createNftData(tokenId, obj, collection_id);
}

//createNft()

module.exports = {
    createNft
};
