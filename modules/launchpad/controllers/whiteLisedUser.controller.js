const { WhiteListedUser, LaunchPadCollection } = require("../models/index");
const ResponseObject = require("../../../utils/ResponseObject");
const { VerifySign } = require("../../comman/verifyUserWeb3");
const { getUTCDate, createUTCDate } = require("../../helpers/timezone")

exports.createWhiteListUser = async (req, res) => {
  try {
    const { collectionId, userAddresses } = req.body;
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
    const { collectionId, userAddresses } = req.body;
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
      networkId
    } = req.body;
   
   // startDate = {$gt: await getUTCDate()}

    const userAddress = req.userData.account
    const checkUser = await WhiteListedUser.findOne({
      userAddress,
      collectionId,
    });
    let isWhiteListed = true;
    if (!checkUser) {
      isWhiteListed = false;
    }
   
    const findCollection  = await LaunchPadCollection.findOne({_id: collectionId})
    if(isWhiteListed == false){
      if(findCollection.endDate){
        if(findCollection.endDate < await getUTCDate()){
          isWhiteListed = true
        }
      }
      if(isWhiteListed == false){
        return res
        .status(400)
        .send(
          new ResponseObject(
            400,
            "You don't have access to this collection",
            []
          )
        );
      }      
    }
    
    let nonce = 1
    if(findCollection){
      nonce = findCollection.nonce?findCollection.nonce+1:nonce
      await findCollection.save()
    }    

    let launchpadFactoryAddress = "";
    if(networkId == process.env.ETHEREUM_NETWORK_ID){
      launchpadFactoryAddress = process.env.LAUNCHPAD_FACTORY_ADDRESS_ETHEREUM
    }else if(networkId == process.env.BSC_NETWORK_ID){
      launchpadFactoryAddress = process.env.LAUNCHPAD_FACTORY_ADDRESS_BSC
    }

    const message = {
      collectionAddress,
      launchpadFactoryAddress,
      userAddress,
      nonce,
      isWhiteListed
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