const { CollectionNFTs, Nfts, Users } = require("../models");
const jwt_decode = require("jwt-decode");
const Web3 = require("web3");
const collectionFactoryAbi = require("../config/collectionFactory.json");
const req = require("express/lib/request");
const specialCharacter = require("../helpers/RegexHelper");
let WEB3_URL = process.env.WEB3_URL;
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL;
const web3 = new Web3(WEB3_URL);
const contractInstance = new web3.eth.Contract(
  collectionFactoryAbi.abi,
  process.env.COLLECTION_FACTORY
);
const { getAdminAddress } = require("../helpers/adminHelper");
module.exports = {
  approveCollectionController: async (req, res) => {
    const { id } = req.body;
    try {
      let userdata;
      const bearerHeaders = req.headers["authorization"];
      if (typeof bearerHeaders !== "undefined") {
        const bearer = bearerHeaders.split(" ");
        const bearerToken = bearer[1];
        userdata = jwt_decode(bearerToken);
        userdata = await Users.findOne({ _id: userdata._id });
        // userid = userdata._id;
      }

      // let admin = await contractInstance.methods.owner().call();
      const isAdmin = await getAdminAddress(userdata.account);
      if (isAdmin) {
        if (!id) {
          return res.status(400).json({
            status: 400,
            success: false,
            message: "Please Pass The Correct Data",
          });
        }
        const checkMoralisesDataStatus = await CollectionNFTs.findOne({
          _id: id ,
          $or: [
            { isMoralisesDataStatus: null },
            { isMoralisesDataStatus: "completed" },
          ],
        });
        if (!checkMoralisesDataStatus) {
          return res.status(400).json({
            status: 400,
            success: false,
            message: "This collection can be not approved",
          });
        }
        id &&
          (await CollectionNFTs.updateOne(
            { _id: id },
            { $set: { approve: true } },
            { multi: true }
          ));
        const updateResponse =
          id && (await CollectionNFTs.findOne({ _id: id  }));
        res.status(200).json({
          data: updateResponse,
          status: 200,
          success: true,
          message: "Approve Collections Successfully",
        });
      } else {
        return res.status(400).json({
          error: true,
          status: 400,
          success: false,
          message: "You don't have permission",
        });
      }
    } catch (error) {
      res.status(400).json({
        error: error.message,
        status: 400,
        success: false,
        message: "Failed To Approve Collections",
      });
    }
  },
  deactivateNftsController: async (req, res) => {
    try {
      let userdata;
      const bearerHeaders = req.headers["authorization"];
      if (typeof bearerHeaders !== "undefined") {
        const bearer = bearerHeaders.split(" ");
        const bearerToken = bearer[1];
        userdata = jwt_decode(bearerToken);
        userdata = await Users.findOne({ _id: userdata._id });
        // userid = userdata._id;
      }
      
      const isAdmin = await getAdminAddress(userdata.account);
      if (isAdmin) {
        const { ids } = req.body;
        if (!ids) {
          return res.status(400).json({
            status: 400,
            success: false,
            message: "Please Pass The Correct Data",
          });
        }
        ids &&
          (await Nfts.updateMany(
            { _id: { $in: ids } },
            { $set: { isSale: false, isActive: false } },
            { multi: true }
          ));

        //Update MaxSupply
        for (let index = 0; index < ids.length; index++) {
          const id = ids[index];
          let nft = await Nfts.findOne({ id: id });
          await Nfts.findOneAndUpdate({_id: id, saleType:"Auction" }, {$set:{
            time:new Date().getTime()
          }})
          if (nft) {
            let collectionnfts = await CollectionNFTs.findOne({
              collectionAddress: nft.collectionAddress,
            });
            if (collectionnfts && collectionnfts.maxSupply) {
              let maxsupply = collectionnfts.maxSupply;
              if (maxsupply) {
                maxsupply = maxsupply - 1;
                await CollectionNFTs.findOneAndUpdate(
                  { collectionAddress: nft.collectionAddress },
                  { maxSupply: maxsupply }
                );
              }
            }
          }
        }
        const updateResponse = ids && (await Nfts.find({ _id: { $in: ids } }));
        return res.status(200).json({
          data: updateResponse,
          status: 200,
          success: true,
          message: "Deactive Nfts Successfully",
        });
      } else {
        return res.status(400).json({
          error: true,
          status: 400,
          success: false,
          message: "You don't have permission",
        });
      }
    } catch (err) {
      return res.status(400).json({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Deactivate Nft",
      });
    }
  },
  blockUserController: async (req, res) => {
    const { ids } = req.body;
    try {
      let userdata;
      const bearerHeaders = req.headers["authorization"];
      if (typeof bearerHeaders !== "undefined") {
        const bearer = bearerHeaders.split(" ");
        const bearerToken = bearer[1];
        userdata = jwt_decode(bearerToken);
        userdata = await Users.findOne({ _id: userdata._id });
        // userid = userdata._id;
      }

      const isAdmin = await getAdminAddress(userdata.account);
      if (isAdmin) {
        ids &&
          (await Users.update(
            { _id: { $in: ids } },
            { $set: { isBlackList: true } },
            {
              multi: true,
            }
          ));
        const updateResponse = ids && (await Users.find({ _id: { $in: ids } }));
        return res.status(200).json({
          data: updateResponse,
          status: 200,
          success: true,
          message: "User Blocked Successfully",
        });
      } else {
        return res.status(400).json({
          error: true,
          status: 400,
          success: false,
          message: "You don't have permission",
        });
      }
    } catch (err) {
      return res.status(400).json({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Blocked User",
      });
    }
  },
  getCollectionAdminController: async (req, res) => {
    const { page, limit } = req.query;
    try {
      let count = await CollectionNFTs.countDocuments();
      //BUILD QUERY
      // 1A) Filtering
      const queryObj = { ...req.query };
      //1B) Advanced filtering
      let queryString = JSON.stringify(queryObj);
      queryString = queryString.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      );
      let query = CollectionNFTs.find(JSON.parse(queryString));
      count = await CollectionNFTs.countDocuments(query);
      // 2) Sorting
      if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
      } else {
        query = query.sort("-createdAt");
      }
      if (req.query.search) {
        // const searchBy = req.query.search.split(",").join(" ");
        let search = await specialCharacter.specialCharacter(req.query.search);
        let searchBy = new RegExp(".*" + search + ".*", "i");
        query = query.find({
          $or: [
            { nameNFT: searchBy },
            { name: searchBy },
            { symbolNFT: searchBy },
          ],
        });
        count = await CollectionNFTs.countDocuments({
          $or: [
            { nameNFT: searchBy },
            { name: searchBy },
            { symbolNFT: searchBy },
          ],
        });
      }
      const response = await query
        .limit(limit > 0 ? limit * 1 : 0)
        .skip(page > 0 ? (page - 1) * limit : 0);
      // const count = await CollectionNFTs.countDocuments();
      if (response.length) {
        return res.status(200).send({
          data: response,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          status: 200,
          success: true,
          message: "Get All Collections Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "No All Collections Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch All Collection",
      });
    }
  },
  updateNftStatusController: async (req, res) => {
    try {
      const body = req.body;
      let userdata;
      const bearerHeaders = req.headers["authorization"];
      if (typeof bearerHeaders !== "undefined") {
        const bearer = bearerHeaders.split(" ");
        const bearerToken = bearer[1];
        userdata = jwt_decode(bearerToken);
        userdata = await Users.findOne({ _id: userdata._id });
        // userid = userdata._id;
      }

      const isAdmin = await getAdminAddress(userdata.account);
      if (isAdmin) {
        let nftIds = req.body.nftIds;
        await Nfts.updateMany({ _id: { $in: nftIds } }, { isSale: false });
        // for (const nftId of nftIds) {
        //   const getNftData = await Nfts.findOne({_id: nftId})
        //   let getCollection = await CollectionNFTs.findOne({collectionAddress: getNftData.collectionAddress})
        //   getCollection.maxSupply = getCollection.maxSupply - 1
        //   await getCollection.save()
        // }
        return res.status(200).json({
          data: [],
          status: 200,
          success: true,
          message: "Nft updated successfully",
        });
      } else {
        return res.status(400).json({
          error: true,
          status: 400,
          success: false,
          message: "You don't have permission",
        });
      }
    } catch (error) {
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
};
