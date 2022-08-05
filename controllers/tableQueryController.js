const {
  CollectionNFTs,
  Users,
  Nfts,
  Nonce,
  History,
  UserFollower,
  ImageUploadLogs,
} = require("../models");

module.exports = {
  checkTableQueryData: async (req, res) => {
    try {
      const { table, filter = '' } = req.body;
      let result = []
      if ("collectionNFTs" === table) {
        result = await CollectionNFTs.find(filter).limit(50).sort({"createdAt":"-1"});
      } else if ("nfts" === table) {
        data = await Nfts.find(filter).limit(50).sort({"createdAt":"-1"});
        result = {
          count:await Nfts.count(filter),
          data:data,
        }
      } else if ("users" === table) {
        result = await Users.find(filter).limit(50).sort({"createdAt":"-1"});
      } else if ("history" === table) {
        result = await History.find(filter).limit(50).sort({"createdAt":"-1"});
      } else if ("userFollower" === table) {
        result = await UserFollower.find(filter).limit(50).sort({"createdAt":"-1"});
      } else if ("userFollower" === table) {
        result = await ImageUploadLogs.find(filter).limit(50).sort({"createdAt":"-1"});
      }else {
        result = await Nonce.find(filter).limit(50).sort({"createdAt":"-1"});
      }
      return res.status(200).json({
        message: "",
        success: true,
        error:false,
        statusCode: 200,
        data:result
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
