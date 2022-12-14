const { CollectionPhase } = require("../models/index");
const ResponseObject = require("../../../utils/ResponseObject");

exports.createCollectionPhase = async (req, res) => {
  try {
    const {
      phase,
      collectionId,
      startTime,
      endTime,
      mintCountPerUser,
      mintCountPerTransaction,
      currencyDetails,
      currencyDetailsForWhiteListed,
      whiteListStartTime,
      whiteListEndTime,
      isWhiteListedUser,
    } = req.body;
    await CollectionPhase.create({
      phase,
      collectionId,
      startTime,
      endTime,
      mintCountPerUser,
      mintCountPerTransaction,
      currencyDetails,
      currencyDetailsForWhiteListed,
      whiteListStartTime,
      whiteListEndTime,
      isWhiteListedUser,
    });

    return res
      .status(201)
      .send(
        new ResponseObject(201, "Collection Phase created successfully", [])
      );
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
