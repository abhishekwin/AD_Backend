const {
  CollectionNFTs,
  Users,
  Nfts,
  Nonce,
  History,
  UserFollower,
  ImageUploadLogs,
  EventManager,
} = require("../models");

const {
  LaunchPadCollection,
  LaunchPadNft,
} = require("../modules/launchpad/models");

module.exports = {
  checkTableQueryData: async (req, res) => {
    try {
      const { table, filter = "" } = req.body;
      let result = [];
      if ("collectionNFTs" === table) {
        result = await CollectionNFTs.find(filter)
          .limit(50)
          .sort({ createdAt: "-1" });
      } else if ("nfts" === table) {
        data = await Nfts.find(filter).limit(50).sort({ createdAt: "-1" });
        result = {
          count: await Nfts.count(filter),
          data: data,
        };
      } else if ("users" === table) {
        result = await Users.find(filter).limit(50).sort({ createdAt: "-1" });
      } else if ("history" === table) {
        result = await History.find(filter).limit(50).sort({ createdAt: "-1" });
      } else if ("userFollower" === table) {
        result = await UserFollower.find(filter)
          .limit(50)
          .sort({ createdAt: "-1" });
      } else if ("userFollower" === table) {
        result = await ImageUploadLogs.find(filter)
          .limit(50)
          .sort({ createdAt: "-1" });
      } else if ("eventManager" === table) {
        result = await EventManager.find(filter)
          .limit(50)
          .sort({ createdAt: "-1" });
      } else if ("launchPadCollection" === table) {
        result = await LaunchPadCollection.find(filter)
          .limit(100)
          .sort({ createdAt: "-1" });
      } else if ("launchPadNft" === table) {
        result = await LaunchPadNft.find(filter)
          .limit(100)
          .sort({ createdAt: "-1" });
      } else {
        result = await Nonce.find(filter).limit(50).sort({ createdAt: "-1" });
      }
      return res.status(200).json({
        message: "",
        success: true,
        error: false,
        statusCode: 200,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message,
        success: false,
        statusCode: 400,
      });
    }
  },
};
