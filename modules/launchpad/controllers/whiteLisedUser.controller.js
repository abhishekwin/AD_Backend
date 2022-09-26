const { WhiteListedUser, LaunchPadCollection } = require("../models/index");
const ResponseObject = require("../../../utils/ResponseObject");
const { VerifySign } = require("../../comman/verifyUserWeb3");

exports.createWhiteListUser = async (req, res) => {
  try {
    const { collectionId, userAddresses } = req.body;
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
      userAddress,
      collectionId,
      launchpadFactoryAddress,
      collectionAddress,
    } = req.body;
    const findCollection  = await LaunchPadCollection.findOne({_id: collectionId})
    let nonce = 1
    if(findCollection){
      nonce = findCollection.nonce?findCollection.nonce+1:nonce
      await findCollection.save()
    }
    const checkUser = await WhiteListedUser.findOne({
      userAddress,
      collectionId,
    });
    let isWhiteListed = true;
    if (!checkUser) {
      isWhiteListed = false;
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
    return res
      .status(201)
      .send(
        new ResponseObject(
          201,
          "Signature generate successfully",
          generateSignature
        )
      );
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
