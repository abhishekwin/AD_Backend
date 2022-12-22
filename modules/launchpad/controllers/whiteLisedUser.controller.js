const { 
  WhiteListedUser, 
  LaunchPadCollection, 
  LaunchPadMintHistory,
  LaunchPadCollectionPhase 
} = require("../models/index");
const ResponseObject = require("../../../utils/ResponseObject");
const { VerifySign } = require("../../comman/verifyUserWeb3");
const moment = require('moment')
const today = moment()

exports.createWhiteListUser = async (req, res) => {
  try {
    const { collectionId, userAddresses, phaseId } = req.body;

    const authenticateUser = await LaunchPadCollection.findOne({creator: req.userData.account.toLowerCase()})
  
    if(!authenticateUser){
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
    const authenticateUser = await LaunchPadCollection.findOne({creator: req.userData.account.toLowerCase()})
    if(!authenticateUser){
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

    const userAddress = req.userData.account
    const findCollection  = await LaunchPadCollection.findOne({_id: collectionId})

    // let userMintCount = await LaunchPadMintHistory.count({userAddress: userAddress, collectionAddress:collectionAddress.toLowerCase()})
    // if(!findCollection){
    //   return res
    //   .status(400)
    //   .send(
    //     new ResponseObject(400, "Collection not found")
    //   );
    // }
    // if(findCollection.mintCountPerUser){
    //   if(findCollection.mintCountPerUser <= userMintCount){
    //     return res
    //     .status(400)
    //     .send(
    //       new ResponseObject(400, "Signature generation failed")
    //     );
    //   }      
    // }
    
    let nonce = 1
    if(findCollection){
      nonce = findCollection.nonce?findCollection.nonce+1:nonce
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
    if(networkId == process.env.ETHEREUM_NETWORK_ID){
      launchpadFactoryAddress = process.env.LAUNCHPAD_FACTORY_ADDRESS_ETHEREUM
    }else if(networkId == process.env.BSC_NETWORK_ID){
      launchpadFactoryAddress = process.env.LAUNCHPAD_FACTORY_ADDRESS_BSC
    }

    phaseValidationFilter = {
      collectionId:collectionId,
      phase:phase,
      startTime:{$gte: today.toDate()},
    };
    console.log(phaseValidationFilter)
    let phaseValidation = await LaunchPadCollectionPhase.findOne(phaseValidationFilter);
    console.log(
      "phaseValidation", phaseValidation
    )
    if(!phaseValidation){
      return res
      .status(400)
      .send(
        new ResponseObject(400, "Not vailed user")
      );
    }
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
    const data = {sign: generateSignature, signData:message, nonce}
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
    return res.status(500).json({
      error: error.message,
    });
  }
};