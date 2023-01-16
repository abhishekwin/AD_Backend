const {
  WhiteListedUser,
  LaunchPadCollection,
  LaunchPadMintHistory,
  LaunchPadCollectionPhase
} = require("../models/index");
const ResponseObject = require("../../../utils/ResponseObject");
const { VerifySign } = require("../../comman/verifyUserWeb3");
const moment = require('moment')

let LAUNCHPAD_BSC_WEB3_URL = process.env.LAUNCHPAD_BSC_WEB3_URL;
let LAUNCHPAD_ETH_WEB3_URL = process.env.LAUNCHPAD_ETH_WEB3_URL;
let ETHEREUM_NETWORK_ID = process.env.ETHEREUM_NETWORK_ID
let BSC_NETWORK_ID = process.env.BSC_NETWORK_ID;

const Web3 = require("web3");
const LaunchpadAbi = require("../../../config/launchpad/abi.json");

exports.createWhiteListUser = async (req, res) => {
  try {
    const { collectionId, userAddresses, phaseId } = req.body;

    const authenticateUser = await LaunchPadCollection.findOne({ creator: req.userData.account.toLowerCase() })

    if (!authenticateUser) {
      return res
        .status(400)
        .send(
          new ResponseObject(400, "Invalid User")
        );
    }
    for (const userAddress of userAddresses) {
      await WhiteListedUser.create({
        collectionId,
        userAddress,
        phaseId
      });
    }
    return res
      .status(201)
      .send(
        new ResponseObject(201, "white listed user created successfully", [])
      );
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.updateWhiteListUser = async (req, res) => {
  try {
    const { collectionId, userAddresses, userLevel } = req.body;
    const authenticateUser = await LaunchPadCollection.findOne({ creator: req.userData.account.toLowerCase() })
    if (!authenticateUser) {
      return res
        .status(400)
        .send(
          new ResponseObject(400, "Invalid User")
        );
    }
    await WhiteListedUser.deleteMany({ collectionId });
    let whiteListUser = [];
    for (const userAddress of userAddresses) {
      whiteListUser.push({ collectionId, userAddress });
    }
    await WhiteListedUser.insertMany(whiteListUser);
    return res
      .status(201)
      .send(
        new ResponseObject(201, " White listed user updated successfully", [])
      );
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.createSignature = async (req, res) => {
  try {
    const {
      collectionId,
      collectionAddress,
      networkId,
      phase
    } = req.body;
    const today = moment();
    let WEB3_URL_FOR_CREATE_SIGN = ""
    if(BSC_NETWORK_ID == networkId){
      WEB3_URL_FOR_CREATE_SIGN = LAUNCHPAD_BSC_WEB3_URL
    }
    if(ETHEREUM_NETWORK_ID == networkId){
      WEB3_URL_FOR_CREATE_SIGN = LAUNCHPAD_ETH_WEB3_URL
    }

    const userAddress = req.userData.account
    const findCollection = await LaunchPadCollection.findOne({ _id: collectionId })

    let nonce = 1
    if (findCollection) {
      nonce = findCollection.nonce ? findCollection.nonce + 1 : nonce
      await findCollection.save()
    }
    const checkUser = await WhiteListedUser.findOne({
      userAddress,
      collectionId
    });
    let isWhiteListed = true;
    if (!checkUser) {
      isWhiteListed = false;
    }

    let launchpadFactoryAddress = "";
    if (networkId == process.env.ETHEREUM_NETWORK_ID) {
      launchpadFactoryAddress = process.env.LAUNCHPAD_FACTORY_ADDRESS_ETHEREUM
    } else if (networkId == process.env.BSC_NETWORK_ID) {
      launchpadFactoryAddress = process.env.LAUNCHPAD_FACTORY_ADDRESS_BSC
    }

    phaseValidationFilter = {
      collectionId: collectionId,
      phase: phase,
      startTime: { $lt: today.toDate() },
      endTime: { $gt: today.toDate() },
     // $and: [{ startTime: {$lt: today.toDate() } }, { endTime: { $gt: today.toDate() } }]
     
    };
    console.log("phaseValidationFilter", phaseValidationFilter, phaseValidationFilter.$and)
    let phaseValidation = await LaunchPadCollectionPhase.findOne(phaseValidationFilter);

    if (!phaseValidation) {
      return res
        .status(400)
        .send(
          new ResponseObject(400, "Not vailed user")
        );
    }

    try{
      const web3 = new Web3(WEB3_URL_FOR_CREATE_SIGN)
      const contractInstance = new web3.eth.Contract(LaunchpadAbi.abi, collectionAddress.toLowerCase())
      const mintCountBlockChain = await contractInstance.methods.nftMinted(userAddress).call()
      
      if(phaseValidation.mintCountPerUser <= mintCountBlockChain){
        return res
          .status(400)
          .send(
            new ResponseObject(400, "Your mint limit is over")
          );
      }
    }catch(e){
      console.log("User mint count not found")
    }
   
    
    console.log("--", {
      collectionAddress,
      launchpadFactoryAddress,
      userAddress,
      nonce,
      isWhiteListed,
      phase
    })
    const message = {
      collectionAddress,
      launchpadFactoryAddress,
      userAddress,
      nonce,
      isWhiteListed,
      phase
    };

    const generateSignature = await VerifySign(message);
    if (generateSignature) {
      await LaunchPadCollection.findOneAndUpdate(
        { _id: collectionId },
        { nonce },
        { new: true }
      );
    }
    const data = { sign: generateSignature, signData: message, nonce }
    return res
      .status(201)
      .send(
        new ResponseObject(
          201,
          "Signature generate successfully",
          data
        )
      );
  } catch (error) {
    console.log("error", error)
    return res.status(500).json({
      error: error.message,
    });
  }
};