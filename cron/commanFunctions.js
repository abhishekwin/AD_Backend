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


const createUser = async (account) => {  
    let user = await Users.create({account : account});
    return user
}


module.exports = {
    createUser
};
