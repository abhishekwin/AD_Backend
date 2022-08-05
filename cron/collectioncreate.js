const axios = require("axios");
const fs = require("fs");
const blueFiAbi = require("../config/bleufi.json");
const collectionFactoryAbi = require("../config/collectionFactory.json");
const collectionERC721Abi = require("../config/collectionERC721.json");
const Web3 = require("web3");
const { Nfts, EventManager, CollectionNFTs, Users, History } = require("../models");
const mongoose = require("mongoose");
const { get } = require("https");
// const { webOnSaleFunction } = require("./onsaleevent");
// const { webOnTransferFunction } = require("./onTransferEvent");
require('dotenv').config({path: '../.env'});
let WEB3_URL = process.env.WEB3_URL
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL
let WEB3_URLFOR_WWS = process.env.WEB3_URLFOR_WWS
let DELAY_SECOUND = process.env.DELAY_SECOUND
let RE_TRY_FUNCTION = process.env.RE_TRY_FUNCTION
const Sentry = require('@sentry/node');
const SentryTracing = require('@sentry/tracing');

Sentry.init({ dsn: "https://bda3b26009ae425c9eff059033784b69@o1187166.ingest.sentry.io/6307095" });

const {createUser} = require("./commanFunctions");
let RESERVE_MARKETPLACE = process.env.RESERVE_MARKETPLACE;
let FIXED_MARKETPLACE = process.env.FIXED_MARKETPLACE;

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    //logger.info('Connected to MongoDB');
  })
  .catch((e) => {
    console.log("error", e);
  });


const createCollectionFunction = async (from, till) => {
  const url = SUB_GRAPH_URL;
  const query = {
    "query": `query MyQuery {\n  collections(\n    first: 50\n    where: {timestamp_gt: ${from}}\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    creator\n    id\n    name\n    timestamp\n  }\n}`,
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
    return result.data.data.collections
  }
  return []
};

const getBaseWebData = async (url) => {
  const result = await axios.get(url);
  if (result.status == 200) {
    return result.data;
  }
  return null;
};

const getContractWebData = async (url) => {
  const result = await axios.get(url);
  if (result.status == 200) {
    return result.data;
  }
  return null;
};

const getPlaceHolderRes = async (url) => {
  const result = await axios.get(url);
  if (result.status == 200) {
    return result.data;
  }
  return null;
}

const createCollections = async (collectionObj) => {
  let resultCollection = await CollectionNFTs.create(collectionObj);
  return resultCollection;
};

const updateCollections = async (collectionObj, collectionid) => {
  await CollectionNFTs.findOneAndUpdate(
    { collectionAddress: collectionid },
    collectionObj
  );
};

const createNfts = async (nftsObj, contractResponse, placedHolderUri, web3callcount=0) => {
  try{
    
    let resultNfts = await Nfts.create(nftsObj);
    if (contractResponse.maxSupply >= contractResponse.startRange && contractResponse.maxSupply <= contractResponse.endRange) {
      let objPlaced = {
        name: placedHolderUri.name,
        description: placedHolderUri.description,
        image: placedHolderUri.image,
        edition: placedHolderUri.edition,
        created: placedHolderUri.date,
        attributes: placedHolderUri.attributes,
        compiler: placedHolderUri.compiler,
      }
      await Nfts.findOneAndUpdate({ collectionAddress: resultNfts.collectionAddress, tokenId: resultNfts.tokenId }, objPlaced);
    }
    return true
  }catch(e){
    console.log("collection create", e);
    Sentry.captureException(e)
    web3callcount++;
    await sleep(DELAY_SECOUND);
    if(web3callcount > RE_TRY_FUNCTION){
        return null;
    }else{
        return await createNfts(nftsObj, contractResponse, placedHolderUri, web3callcount);
    }
  }
  

};

const updateNfts = async (nftsObj) => {
  await Nfts.findOneAndUpdate(
    { tokenId: nftsObj.tokenId },
    nftsObj
  );
};

const historyCreate = async (obj, subGraphData) => {

  let user = await Users.findOne({account:obj.owner});
  if(!user){
      if(obj.owner.toLowerCase() != RESERVE_MARKETPLACE.toLowerCase() 
      && obj.owner.toLowerCase() != FIXED_MARKETPLACE.toLowerCase()){
          user = await createUser(obj.owner);
      }
  }
  let nft = await Nfts.findOne({collectionAddress:obj.collectionAddress, tokenId:obj.tokenId});
  let history = await History.findOne({epochTime:subGraphData.timestamp, nftId:nft.id});
  if(!history){
    await History.create({
        userId: user?user.id:null,
        oldUserId:  user?user.id:null,
        nftId: nft?nft.id:null,
        actionType: 0, 
        price: nft?nft.price:0, 
        paymentType: nft?nft.paymentType:null, 
        time: new Date(),
        epochTime: subGraphData.timestamp
    })
  }
}

const manageData = async (collectiondata, web3callcount) => {
  try {
    for (const data of collectiondata) {
      if(!data.creator) continue;
      let collectionid = data.id.toLowerCase();
      const web3 = new Web3(WEB3_URL);
      const contractInstance = new web3.eth.Contract(
        collectionERC721Abi.abi,
        collectionid
      );
      let contractURI = await contractInstance.methods.contractURI().call();
      let baseURI = await contractInstance.methods.baseURI().call();
      let placeHolderURI = await contractInstance.methods.placeholderURI().call();
      
      if(contractURI.includes("https://ipfs.io/")){
        contractURI = contractURI.replace("https://ipfs.io/", "https://bleufi.mypinata.cloud/");
        baseURI = baseURI.replace("https://ipfs.io/", "https://bleufi.mypinata.cloud/");
        placeHolderURI = placeHolderURI.replace("https://ipfs.io/", "https://bleufi.mypinata.cloud/");        
      }
       
      if(contractURI.length > 25 || baseURI > 25 || placeHolderURI > 25 ){
        const placedHolderUri = await getPlaceHolderRes(placeHolderURI);
        let baseResponse = {};
        let contractResponse = await getContractWebData(contractURI);
        if(contractResponse){                    
          try{
            contractResponse.creator = contractResponse.creator.toLowerCase();
            let ObjCollection = {
              collectionAddress: collectionid,
              name: contractResponse.name,
              baseURI: baseURI,
              maxSupply: contractResponse.maxSupply,
              owner: contractResponse.creator,
              creator: contractResponse.creator,
              royalties: contractResponse.royalties,
              symbolNFT: contractResponse.symbolNFT,
              startRange: contractResponse.startRange,
              endRange: contractResponse.endRange,
              maxSupply: contractResponse.maxSupply,
              imageCover: contractResponse.image,
              bannerImages: contractResponse.bannerImages,
            };
            let existCollection = await CollectionNFTs.findOne({
              collectionAddress: collectionid,
            });
            if (existCollection) {
              await updateCollections(ObjCollection, collectionid);
            } else {
              let resResult = await createCollections(ObjCollection);
              if(resResult){
                 await collectionCreateData(resResult, baseURI, collectionid, placedHolderUri, data, ObjCollection, placeHolderURI);
              }
            }
            await EventManager.updateOne({name:"collection"}, {lastcrontime: data.timestamp})
          }catch(e){
            Sentry.captureException(e)
            console.error("Collection error", e)
          }
         
        }else{
          await EventManager.updateOne({name:"collection"}, {lastcrontime: data.timestamp})
        }
        
      }      
    }
  } catch (e) {
    console.log("collection create", e);
    Sentry.captureException(e)
    web3callcount++;
    await sleep(DELAY_SECOUND);
    if(web3callcount > RE_TRY_FUNCTION){
        return null;
    }else{
        return await manageData(collectiondata, web3callcount);
    }
  }
};


async function collectionCreateData(contractResponse, baseURI, collectionid, placedHolderUri, subGraphData, ObjCollection, placeHolderURI, web3callcount=0) {
  try{
    //console.log("contractResponse.maxSupply", contractResponse.maxSupply);
    for (let step = 1; step <= contractResponse.maxSupply; step++) {
      let id = step;
      let updateUri = null
      if (step >= ObjCollection.startRange && step <= ObjCollection.endRange) {
        updateUri = placeHolderURI;
      }
      else {
        updateUri = baseURI.replace("{id}", id);
      }
      baseResponse = await getBaseWebData(updateUri);
      //console.log("baseResponse", baseResponse)
      let objNfts = {
        collectionAddress: collectionid,
        royalties: ObjCollection.royalties?ObjCollection.royalties:0,
        name: baseResponse.name,
        description: baseResponse.description,
        image: baseResponse.image,
        tokenURI: updateUri?updateUri:null,
        owner: contractResponse.creator,
        creator: contractResponse.creator,
        tokenId: id,
        // dna: baseResponse.dna,
        edition: baseResponse.edition,
        created: baseResponse.date,
        attributes: baseResponse.attributes,
        compiler: baseResponse.compiler,
        isFirstSale:true
      };
     
      let existNfts = await Nfts.findOne({
        collectionAddress: collectionid, tokenId: id
      });
      if (existNfts !== null) {
        await updateNfts(objNfts);
      } else {
        let result = await createNfts(objNfts, contractResponse, placedHolderUri);
        if(result){
          await historyCreate(objNfts, subGraphData);
        }
      }
    }
  }catch(e){
    console.log("Collection error", e)
    Sentry.captureException(e)
    web3callcount++;
    await sleep(DELAY_SECOUND);
    if(web3callcount > RE_TRY_FUNCTION){
        return null;
    }else{
        return await collectionCreateData(contractResponse, baseURI, collectionid, placedHolderUri, subGraphData, ObjCollection, placeHolderURI, web3callcount);
    }
  }
  
}


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const createCollection = async (web3callcount=0) => {
  try{
      let eventDetails = await EventManager.findOne({ name: "collection" })
      let from = 0
      if (eventDetails) {
        from = eventDetails.lastcrontime;    
      } else {
        await EventManager.create({ name: "collection", lastcrontime: 0 })
      }
      let querydata = await createCollectionFunction(from);
      if(querydata && querydata.length > 0){
        querydata = querydata.reverse();
        await manageData(querydata);
      }
  }catch(e){
      console.log("Collection error", e)
      Sentry.captureException(e)
      web3callcount++;
      await sleep(DELAY_SECOUND);
      if(web3callcount > RE_TRY_FUNCTION){
          return null;
      }else{
          return await createCollection(web3callcount);
      }
  }
  
};

// createCollection();
module.exports = {
  createCollection
};
