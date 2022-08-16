const { WhiteListedUser } = require("../models/index");
const { VerifySign } = require('../../comman/verifyUserWeb3')

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

exports.verifyMinter = async (req, res) => {
  try {
    const { nonce, userAddress, collectionId } = req.body;

    const checkUser = await WhiteListedUser.findOne({
      userAddress,
      collectionId,
    });
    let isWhiteListed = true;
    if (!checkUser) {
      isWhiteListed = false;
    }
    const message = {
      nonce,
      userAddress,
      isWhiteListed
    }
    const generateSignature = await VerifySign(message)
    return res
      .status(201)
      .send(new ResponseObject(201, "verify minter successfully", generateSignature));
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
