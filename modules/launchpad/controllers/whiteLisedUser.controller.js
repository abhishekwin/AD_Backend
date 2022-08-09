const { WhiteListedUser } = require("../models/index");

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
