const {
  CollectionNFTs,
  Users,
  Nfts,
  Nonce,
  History,
  UserFollower,
} = require("../models");
const helpers = require("../helpers/helper");
const BleuFiNFT = require("../config/bleufi.json");
const jwt = require("jsonwebtoken");
const Web3 = require("web3");
const { map } = require("modern-async");
let WEB3_URL = process.env.WEB3_URL;
let SUB_GRAPH_URL = process.env.SUB_GRAPH_URL;
const specialCharacter = require("../helpers/RegexHelper");
const jwt_decode = require("jwt-decode");
const { getMoralisInfo } = require("../middleware/moralisApi");
const { getAdminAddress } = require("../helpers/adminHelper");
const { customPagination } = require("../helpers/pagination");
//const { auctionEndQuery, marketSolds } = require("../services/graphql");
const userfollower = require("../config/usersBleufi.json");
const { getQueryString } = require("../utils/commanFunction");

loginUserDataFunaction = (req) => {
  // let loginuserdata = req.userData;
  let loginuserdata;
  const bearerHeaders = req.headers["authorization"];
  if (typeof bearerHeaders !== "undefined") {
    const bearer = bearerHeaders.split(" ");
    const bearerToken = bearer[1];
    loginuserdata = jwt_decode(bearerToken);
    return loginuserdata;
    // userid = userdata._id;
  }
  return false;
};

getTopCollectionIds = async () => {
  //let historyData = await History.find({$or: [{ actionType: 1 }, { actionType: 4 }]});

  let historyData = await History.find({
    $or: [{ actionType: 1 }, { actionType: 4 }],
  })
    .populate([
      {
        path: "nftDetails",
        select: "collectionAddress",
      },
    ])
    .select("nftId");

  let collectionIds = await map(historyData, async (item) => {
    if (item.nftDetails && item.nftDetails.collectionAddress) {
      return item.nftDetails.collectionAddress;
    }
  });

  collectionIds = collectionIds.filter(function (element) {
    return element !== undefined;
  });
  collectionIds = collectionIds.reduce((total, value) => {
    total[value] = (total[value] || 0) + 1;
    return total;
  }, {});

  return collectionIds;
};

module.exports = {
  saveNftsController: async (req, res) => {
    try {
      const nfts = new Nfts(req.body);
      const response = await nfts.save();
      return res.status(201).json({
        data: response,
        status: 201,
        success: true,
        message: "Create Nfts Item Successfully",
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        status: 400,
        success: false,
        message: "Failed To Create Nfts Item",
      });
    }
  },
  saveCollectionController: async (req, res) => {
    try {
      const collection = new CollectionNFTs(req.body);
      const response = await collection.save();
      return res.status(201).json({
        data: response,
        status: 201,
        success: true,
        message: "Create Collection Successfully",
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        status: 400,
        success: false,
        message: "Failed To Create Collection",
      });
    }
  },
  getNftListController: async (req, res) => {
    const { page, limit } = req.query;
    try {
      let count = await Nfts.countDocuments();
      //BUILD QUERY
      // 1A) Filtering
      const queryObj = { ...req.query };
      //1B) Advanced filtering
      let queryString = JSON.stringify(queryObj);
      queryString = queryString.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      );
      let query = Nfts.find(JSON.parse(queryString));
      // process.exit()
      count = await Nfts.countDocuments(query);
      // 2) Sorting
      if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
      } else {
        query = query.sort("-createdAt");
      }
      if (req.query.search) {
        //const searchBy = req.query.search.split(",").join(" ");
        let search = await specialCharacter.specialCharacter(req.query.search);
        let searchBy = new RegExp(".*" + search + ".*", "i");
        query = query.find({
          $or: [{ name: searchBy }, { description: searchBy }],
        });

        //query = query.find({ $text: { $search: searchBy } });
        count = await Nfts.countDocuments({
          $or: [{ name: searchBy }, { description: searchBy }],
        });
      }
      query = query.find({ isActive: true });
      count = await Nfts.countDocuments(query);
      let response = [];
      if (req.query.sort && req.query.sort == "-likes") {
        response = await query;
        response = response.sort((a, b) => b.likes.length - a.likes.length);
        response = response.slice((page - 1) * limit, page * limit);
      } else if (req.query.sort && req.query.sort == "likes") {
        response = await query;
        response = response.sort((a, b) => a.likes.length - b.likes.length);
        response = response.slice((page - 1) * limit, page * limit);
      } else {
        response = await query
          .limit(limit > 0 ? limit * 1 : 0)
          .skip(page > 0 ? (page - 1) * limit : 0);
      }

      // const count = await Nfts.countDocuments();
      if (response.length) {
        return res.status(200).send({
          data: response,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          status: 200,
          success: true,
          message: "Get Nfts Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          status: 200,
          success: true,
          message: "No Nfts Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Nfts Item",
      });
    }
  },
  getTopCollectionController: async (req, res) => {
    try {
      let collectionIds = await getTopCollectionIds();
      collectionIds = Object.keys(collectionIds).sort(
        (a, b) => collectionIds[b] - collectionIds[a]
      );

      const response = await CollectionNFTs.find({
        collectionAddress: { $in: collectionIds },
        approve: true,
      }).limit(10);
      let collectionResponse = [];

      for (const collectionId of collectionIds) {
        let findData = response.find(
          (element) => element.collectionAddress === collectionId
        );
        if (findData) {
          collectionResponse.push(findData);
        }
      }

      return res.status(200).send({
        data: collectionResponse,
        status: 200,
        success: true,
        message: "Get Top 7 Day's Collection Successfully",
      });
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Collection",
      });
    }
  },
  getCreatorListController: async (req, res) => {
    const { page, limit } = req.query;
    try {
      let count = await Users.countDocuments();
      //BUILD QUERY
      // 1A) Filtering
      const queryObj = { ...req.query };
      //1B) Advanced filtering
      let queryString = JSON.stringify(queryObj);
      queryString = queryString.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      );
      let query = Users.find(JSON.parse(queryString));
      count = await Users.countDocuments(query);
      // 2) Sorting
      if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
      } else {
        query = query.sort("-createdAt");
      }
      if (req.query.search) {
        let search = await specialCharacter.specialCharacter(req.query.search);
        let searchBy = new RegExp(".*" + search + ".*", "i");
        query = query.find({
          $or: [
            { firstName: searchBy },
            { lastName: searchBy },
            { nickName: searchBy },
            { bio: searchBy },
          ],
        });
        count = await Users.countDocuments({
          $or: [
            { firstName: searchBy },
            { lastName: searchBy },
            { nickName: searchBy },
            { bio: searchBy },
          ],
        });
      }
      query = query.find({ isBlackList: false });
      count = await Users.countDocuments(query);
      const response = await query
        .limit(limit > 0 ? limit * 1 : 0)
        .skip(page > 0 ? (page - 1) * limit : 0);
      // const count = await Users.countDocuments();
      if (response.length) {
        return res.status(200).send({
          data: response,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          status: 200,
          success: true,
          message: "Fetch Creators Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          status: 200,
          success: true,
          message: "No Creator Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Creators",
      });
    }
  },
  getCreatorListControllerV2: async (req, res) => {
    const { page, limit, sort } = req.body;
    try {
      let loginuserdata;
      const bearerHeaders = req.headers["authorization"];
      if (typeof bearerHeaders !== "undefined") {
        const bearer = bearerHeaders.split(" ");
        const bearerToken = bearer[1];
        loginuserdata = jwt_decode(bearerToken);
        // userid = userdata._id;
      }

      let searchdata = {};
      let filter = { isBlackList: false };
      if (req.body.search) {
        let search = await specialCharacter.specialCharacter(req.body.search);
        let searchBy = new RegExp(".*" + search + ".*", "i");
        searchdata = {
          $or: [
            { firstName: searchBy },
            { lastName: searchBy },
            { nickName: searchBy },
            { bio: searchBy },
          ],
        };
      }
      filter = { ...filter, ...searchdata };
      let follower_id = null;
      if (loginuserdata) {
        follower_id = loginuserdata._id;
      }
      
      // let userdata = await Users.find(filter)
      //   .populate([
      //     {
      //       path: "follower_count",
      //     },
      //     {
      //       path: "is_followed",
      //       match: { follower_id: follower_id },
      //     },
      //   ])
      //   .sort({"followers":1})
      //   .skip((page - 1) * limit)
      //   .limit(limit);
      let sortObj = {createdAt: -1 }
      if(sort == "follwoing"){
        sortObj = {follower_count: 1 }
      }
      if(sort == "-follwoing"){
        sortObj = {follower_count: -1 }
      }
      if(sort == "created"){
        sortObj = {createdAt: 1 }
      }
      if(sort == "-created"){
        sortObj = {createdAt: -1 }
      }

      let userdata = await Users.aggregate([
        {$match: filter },
        {
            $lookup:
              {
                from: "userfollowers",
                localField: "_id",
                foreignField: "user_id",
                as: "followers"
              }
        },
        { $addFields: {follower_count: {$size: "$followers"}}},
        {$sort:  sortObj},
        // {$setWindowFields: {output: {totalCount: {$count: {}}}}}
        {$skip: (page - 1) * limit },
        {$limit: limit } 
    ])

      let count = await Users.countDocuments(filter);

      let data = customPagination(userdata, page, limit, count);
      
      if (data) {
        return res.status(200).send({
          status: 200,
          success: true,
          message: "Fetch Creators Successfully",
          data: data,
        });
      } else {
        return res.status(200).send({
          status: 200,
          success: true,
          message: "No Creator Found",
          data: [],
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Creators",
      });
    }
  },
  getCollectionListController: async (req, res) => {
    const { page, limit, creator } = req.query;
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
        //const searchBy = req.query.search.split(",").join(" ");
        let search = await specialCharacter.specialCharacter(req.query.search);
        let searchBy = new RegExp(".*" + search + ".*", "i");
        query = query.find({ nameNFT: searchBy });
        count = await CollectionNFTs.countDocuments({
          $text: { $search: searchBy },
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
  getNftsByIdController: async (req, res) => {
    const { collectionAddress, id } = req.params;

    let collectionData = await CollectionNFTs.findOne({
      collectionAddress: collectionAddress,
    });
    try {
      let response = await Nfts.findOne({
        _id: id,
        collectionAddress: collectionAddress.toLowerCase(),
      }).populate([
        {
          path: "bidDetails",
          options: { sort: { createdAt: -1 } },
        },
        {
          path: "historyDetails",
          populate: [{ path: "userDetails" }],
          options: { sort: { createdAt: -1 } },
        },
      ]);

      if (response.length) {
        response = response.toJSON();
        let isSale = collectionData ? collectionData.isSale : null;
        if (response.historyDetails && response.historyDetails.length > 3) {
          isSale = null;
        }
        response.collectionOnSale = isSale;
        response.collectionId = collectionData ? collectionData.id : null;
        response.collectionName = collectionData ? collectionData.name : null;
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "Get Nft Successfully",
        });
      } else {
        response = response.toJSON();
        let isSale = collectionData ? collectionData.isSale : null;
        if (response.historyDetails && response.historyDetails.length > 3) {
          isSale = null;
        }
        if (response.isMoralisesNft === true) {
          isSale = null;
        }
        response.collectionOnSale = isSale;
        response.collectionId = collectionData ? collectionData.id : null;
        response.collectionName = collectionData ? collectionData.name : null;
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "No Nft Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Nft Item",
      });
    }
  },
  createProfileController: async (req, res) => {
    const { account } = req.body;
    try {
      const existingUser = await Users.findOne({
        account: account.toLowerCase(),
      });
      if (existingUser._doc.account.toLowerCase() === account.toLowerCase()) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "User Already Exist",
        });
      } else {
        const profileData = new Users(req.body);
        const response = await profileData.save();
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "Profile Created Successfully",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Create Profile",
      });
    }
  },
  getTotalNoOfFollowers: async (req, res) => {
    const { userId } = req.params;
    let totalNoOfFollowers = 0;
    try {
      const response = await Users.find({ _id: userId });
      await response.map(
        (data) => (totalNoOfFollowers = data.followers.length)
      );
      if (response.length) {
        return res.status(200).send({
          data: response[0],
          followers: totalNoOfFollowers,
          status: 200,
          success: true,
          message: "Total No Of Followers Find Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          followers: totalNoOfFollowers,
          status: 200,
          success: true,
          message: "Followers Not Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch total no of followers",
      });
    }
  },
  getProfileByIdController: async (req, res) => {
    const { userId } = req.params;
    try {
      const response = await Users.find({ _id: userId });
      if (response.length) {
        return res.status(200).send({
          data: response[0],
          status: 200,
          success: true,
          message: "Fetch Profiles Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "No Profile Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Profiles",
      });
    }
  },
  addFollowerController: async (req, res) => {
    const { userId, followerId } = req.params;
    try {
      const existingFollower = await Users.find({
        _id: userId,
        followers: followerId,
      });
      if (existingFollower.length > 0) {
        return res.status(200).send({
          status: 200,
          success: true,
          message: "Follower Already Exist",
        });
      } else {
        const response = await Users.findByIdAndUpdate(
          { _id: userId },
          { $push: { followers: followerId } },
          { new: true }
        );
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "Profile Follower Updated Successfully",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To update Profile Follower",
      });
    }
  },
  unFollowController: async (req, res) => {
    const { userId, followerId } = req.params;
    try {
      const response = await Users.findByIdAndUpdate(
        { _id: userId },
        { $pullAll: { followers: [followerId] } },
        {
          new: true,
        }
      );
      return res.status(200).send({
        data: response,
        status: 200,
        success: true,
        message: "Unfollow Successfully",
      });
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To unfollow",
      });
    }
  },
  followUnfollowController: async (req, res) => {
    const { user_id, follower_id } = req.body;
    try {
      const userfollower = await UserFollower.findOne({
        user_id: user_id,
        follower_id: follower_id,
      });
      if (userfollower) {
        await UserFollower.deleteOne({
          user_id: user_id,
          follower_id: follower_id,
        });
        return res.status(200).send({
          data: [],
          status: 200,
          success: true,
          message: "Unfollow Successfully",
        });
      } else {
        await UserFollower.create({
          user_id: user_id,
          follower_id: follower_id,
        });
        return res.status(200).send({
          data: [],
          status: 200,
          success: true,
          message: "Follow Successfully",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To unfollow",
      });
    }
  },
  updateProfileController: async (req, res) => {
    try {
      let userdata = req.userData;
      const reqBody = req.body.data;
      let signature = req.body.sign;
      const web3 = new Web3(WEB3_URL);
      let signaturecheck = await web3.eth.accounts.recover(
        JSON.stringify(reqBody),
        signature
      );
      if (signaturecheck.toLowerCase() === userdata.account.toLowerCase()) {
        // Update the user
        let updateuserdata = {
          avatar: reqBody.avatar,
          bio: reqBody.bio,
          firstName: reqBody.firstName,
          followers: reqBody.followers,
          email: reqBody.email,
          imageCover: reqBody.imageCover,
          instagram: reqBody.instagram,
          lastName: reqBody.lastName,
          nickName: reqBody.nickName,
          subscribe: reqBody.subscribe,
          telegram: reqBody.telegram,
          twitter: reqBody.twitter,
        };
        const response = await Users.findByIdAndUpdate(
          { _id: userdata._id },
          updateuserdata,
          {
            new: true,
          }
        );

        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "Profile updated Successfully",
        });
      } else {
        return res.status(400).json({
          data: null,
          success: false,
          status: 400,
          message: "Could not verify signature",
        });
      }
    } catch (err) {
      console.log("err", err);
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To update profile",
      });
    }
  },
  getTopCreatorController: async (req, res) => {
    try {
      let userfollower = await UserFollower.aggregate([
        { $group: { _id: "$user_id", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      let loginUserData = loginUserDataFunaction(req);
      let follower_id = null;
      if (loginUserData) {
        follower_id = loginUserData._id;
      }

      let highestFollowerIds = await map(userfollower, async (item) => {
        return item._id;
      });
      //console.log("highestFollowerIds", highestFollowerIds)
      let response = await Users.find({
        _id: { $in: highestFollowerIds },
        isBlackList: false,
      })
        .populate([
          {
            path: "follower_count",
          },
          {
            path: "is_followed",
            match: { follower_id: follower_id },
          },
        ])
        .limit(3);
      response = response.sort((sorta, sortb) =>
        sorta.follower_count < sortb.follower_count ? 1 : -1
      );
      if (response.length) {
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "Get Top Creator Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "No Creator Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Creator",
      });
    }
  },
  getProfileByAccountController: async (req, res) => {
    const { accountId } = req.params;
    try {
      let loginUserData = loginUserDataFunaction(req);
      let follower_id = null;
      if (loginUserData) {
        follower_id = loginUserData._id;
      }

      let response = await Users.findOne({
        account: accountId.toLowerCase(),
      }).populate([
        {
          path: "follower_count",
        },
        {
          path: "is_followed",
          match: { follower_id: follower_id },
        },
      ]);

      if (response) {
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "Fetch Profiles Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "No Profile Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Profiles",
      });
    }
  },
  getNonceController: async (req, res) => {
    try {
      let { account_address } = req.body;
      /**Get user by wallet address */
      let userObject = await Users.find({
        
        account: account_address.toLowerCase(),
      });
      if (!userObject.length) {
        // create user if user is not exist
        const userBody = {
          account: account_address.toLowerCase(),
        };
        const user = new Users(userBody);
        await user.save();
      }
      if (userObject.isBlocked) {
        // return if user is blocked
        return res.status(400).json({
          data: null,
          success: false,
          message: "User is blocked",
          status: 400,
        });
      }
      // get unique nonce for user
      const nonce = await helpers.getUniqueCode(16);
      // update user nonce and retrun response
      let updatedUserObject = await Users.findOneAndUpdate(
        { account: account_address.toLowerCase() },
        { nonce: nonce },
        { new: true }
      );
      if (updatedUserObject) {
        return res.status(200).json({
          status: 200,
          message: "Nonce get successfully",
          code: updatedUserObject.code,
          nonce: nonce,
        });
      } else {
        return res.status(400).json({
          status: 400,
          message: "Some thing went wrong",
          code: updatedUserObject,
          nonce: null,
        });
      }
    } catch (error) {
      return res.status(400).json({
        data: null,
        status: 400,
        success: false,
        message: error.message,
      });
    }
  },
  getCountNonceController: async (req, res) => {
    try {
      let response = await Nonce.findOne({});
      if (!response) {
        response = await Nonce.create({ nonce: 1 });
      }
      const web3 = new Web3(WEB3_URL);
      const contractInstance = new web3.eth.Contract(
        BleuFiNFT.abi,
        process.env.BLEUFI_NFT
      );
      let nonce = response._doc.nonce;
      while (await contractInstance.methods.mintedNonce(nonce).call()) {
        nonce++;
      }
      let updatedNonce = await Nonce.findByIdAndUpdate(
        { _id: response._doc._id },
        { nonce: nonce },
        { new: true }
      );
      if (nonce) {
        return res.status(200).send({
          data: updatedNonce,
          status: 200,
          success: true,
          message: "Fetch Nonce Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "No Nonce Found",
        });
      }
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null,
        status: 400,
        success: false,
      });
    }
  },
  createNftItemController: async (req, res) => {
    const { nonceId } = req.params;
    let timestamp = new Date();
    timestamp = parseInt(timestamp / 1000).toFixed(0);
    try {
      let userdata = req.userData;
      const nfts = new Nfts(req.body);
      const response = await nfts.save();
      await History.create({
        userId: userdata._id,
        oldUserId: null,
        nftId: response._id,
        actionType: 0,
        price: response.price,
        paymentType: response.paymentType,
        time: new Date(),
        epochTime: timestamp,
      });
      if (response.isSale == true) {
        await History.create({
          userId: userdata._id,
          oldUserId: null,
          nftId: response._id,
          actionType: 6,
          price: response.price,
          paymentType: response.paymentType,
          time: new Date(),
          epochTime: timestamp,
        });
      }
      await Nonce.findByIdAndUpdate(
        { _id: nonceId },
        { nonce: req.body.nonce },
        { new: true }
      );
      return res.status(201).json({
        data: response,
        status: 201,
        success: true,
        message: "Create Nfts Item Successfully",
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        status: 400,
        success: false,
        message: "Failed To Create Nfts Item",
      });
    }
  },
  verifySignatureController: async (req, res) => {
    try {
      const { nonce, signature } = req.body;
      // get user by nonce
      let user = await Users.findOne({ nonce: nonce });
      // console.log("user", user)
      // check user existance or block field
      if (!user) {
        return res.status(400).json({
          data: null,
          success: false,
          status: 400,
          message: "Invalid nonce",
        });
      }
      if (user.isBlocked) {
        return res.status(400).json({
          data: null,
          status: 400,
          success: false,
          message: "User is block",
        });
      }
      // get contract object by network_id  to verify
      const web3 = new Web3(WEB3_URL);
      let response = await web3.eth.accounts.recover(nonce, signature);
      console.log("response", response)
      if (user.account.toLowerCase() != response.toLowerCase()) {
        return res.status(400).json({
          data: null,
          success: false,
          status: 400,
          message: "Could not verify signature",
        });
      }
      // update user nonce to empty
      await Users.findOneAndUpdate({ account: user.account }, { nonce: "" });
      const isAdmin = await getAdminAddress(user.account);
      user = user.toJSON();
      user.isAdmin = isAdmin;
      // issue jwt token
      const token = await jwt.sign(
        { _id: user._id, account: user.account },
        process.env.SECRET,
        { expiresIn: "24h" }
      );
      return res.status(200).json({
        data: { user, token },
        status: 200,
        success: true,
        message: "Signature verified",
      });
    } catch (error) {
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
  likeDislikeController: async (req, res) => {
    try {
      const { nftId } = req.params;
      let userdata = req.userData;
      let existLike = await Nfts.find({
        _id: nftId,
        likes: { $in: [userdata._id] },
      });
      if (existLike.length) {
        let dislikeResponse = await Nfts.findOneAndUpdate(
          { _id: nftId },
          { $pullAll: { likes: [userdata._id] } },
          { new: true }
        );
        return res.status(200).json({
          data: dislikeResponse,
          status: 200,
          success: true,
          message: "Dislike Nfts",
        });
      } else {
        let likeResponse = await Nfts.findOneAndUpdate(
          { _id: nftId },
          { $push: { likes: userdata._id } },
          { new: true }
        );
        return res.status(200).json({
          data: likeResponse,
          status: 200,
          success: true,
          message: "Like Nfts",
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
  updateNftsController: async (req, res) => {
    const { nftId } = req.params;

    try {
      let updateNftResponse = await Nfts.findOneAndUpdate(
        { _id: nftId },
        req.body,
        { new: true }
      );
      let userdata = req.userData;
      let timestamp = new Date();
      timestamp = parseInt(timestamp / 1000).toFixed(0);

      if (updateNftResponse.isSale == true) {
        await History.create({
          userId: userdata._id,
          oldUserId: null,
          nftId: updateNftResponse._id,
          actionType: 6,
          price: updateNftResponse.price,
          paymentType: updateNftResponse.paymentType,
          time: new Date(),
          epochTime: timestamp,
        });
      }
      if (updateNftResponse) {
        return res.status(200).send({
          data: updateNftResponse,
          status: 200,
          success: true,
          message: "Nfts Update Successfully",
        });
      } else {
        return res.status(400).json({
          data: null,
          error: "Not update",
          status: 400,
          success: false,
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
  fetchOtherNftsController: async (req, res) => {
    const body = req.body;
    try {
      const resMoralisData = await getMoralisInfo(body);
      if (resMoralisData) {
        const newArray = [];
        for (const iterator of resMoralisData.result) {
          const myNfts = await Nfts.findOne({
            owner: body.account,
            collectionAddress: iterator.token_address,
            tokenId: iterator.token_id,
          }).select("id owner tokenId collectionAddress");
          if (!myNfts) {
            newArray.push(iterator);
          }
        }
        resMoralisData.result = newArray;
        if (resMoralisData.result && resMoralisData.result.length) {
          return res.status(200).json({
            data: resMoralisData,
            status: 200,
            success: true,
          });
        } else {
          return res.status(404).json({
            data: "No Data Found",
            status: 404,
            success: false,
          });
        }
      } else {
        return res.status(404).json({
          data: "No Data Found",
          status: 404,
          success: false,
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
  updateUserFollower: async (req, res) => {
    try {
      userfollower.map((d) =>
        d.followers.map(async (follower) => {
          let getFollower = await Users.findOne({ account: follower });
          if (getFollower) {
            const userfollower = await UserFollower.findOne({
              user_id: d._id.$oid,
              follower_id: getFollower.id,
            });
            if (userfollower) {
              await UserFollower.updateOne(
                { user_id: d._id.$oid },
                { follower_id: getFollower.id }
              );
            } else {
              let checkFollower = await UserFollower.findOne({
                user_id: d._id.$oid,
                follower_id: getFollower.id,
              });
              if (!checkFollower) {
                await UserFollower.create({
                  user_id: d._id.$oid,
                  follower_id: getFollower.id,
                });
              }
            }
          }
        })
      );
      return res.status(200).json({
        data: [],
        status: 200,
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
  getBlockedListedNfts: async (req, res) => {
    const { page, limit } = req.query;
    try {
      let userdata = req.userData;
      let count = await Nfts.countDocuments();
      //BUILD QUERY
      // 1A) Filtering
      const queryObj = { ...req.query };
      //1B) Advanced filtering
      let queryString = JSON.stringify(queryObj);
      let query = Nfts.find(JSON.parse(queryString));
      count = await Nfts.countDocuments(query);
      // 2) Sorting
      if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
      } else {
        query = query.sort("-createdAt");
      }
      if (req.query.search) {
        //const searchBy = req.query.search.split(",").join(" ");
        const search = await specialCharacter.specialCharacter(
          req.query.search
        );
        const searchBy = new RegExp(".*" + search + ".*", "i");
        query = query.find({
          $or: [{ name: searchBy }, { description: searchBy }],
        });

        //query = query.find({ $text: { $search: searchBy } });
        count = await Nfts.countDocuments({
          $or: [{ name: searchBy }, { description: searchBy }],
        });
      }
      query = query.find({
        creator: userdata.account.toLowerCase(),
        isActive: false,
        tokenId: { $ne: "0" },
        isCustodyByClaimed: false,
      });
      count = await Nfts.countDocuments(query);
      const response = await query
        .limit(limit > 0 ? limit * 1 : 0)
        .skip(page > 0 ? (page - 1) * limit : 0);
      // const count = await Nfts.countDocuments();
      if (response.length) {
        return res.status(200).send({
          data: response,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          status: 200,
          success: true,
          message: "Get blocked nfts Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          status: 200,
          success: true,
          message: "No Nfts Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Nfts Item",
      });
    }
  },
  updatedNftPutOffSale: async (req, res) => {
    try {
      const { nftId } = req.body;
      const getNftData = await Nfts.findOne({ _id: nftId });
      let getCollection = await CollectionNFTs.findOne({
        collectionAddress: getNftData.collectionAddress,
      });
      getCollection.maxSupply = getCollection.maxSupply - 1;
      await getCollection.save();
      await Nfts.updateOne(
        { _id: nftId },
        { $set: { isCustodyByClaimed: true } }
      );
      return res.status(200).json({
        data: [],
        status: 200,
        success: true,
        message: "Put off sale updated successfully",
      });
    } catch (error) {
      return res.status(400).json({
        data: null,
        error: error.message,
        status: 400,
        success: false,
      });
    }
  },
  saveCollectionWithCollectionAddress: async (req, res) => {
    try {
      req.body.isMoralisesCollection = true;
      req.body.isMoralisesDataStatus = "pending";
      const checkCollectionAddress = await CollectionNFTs.findOne({
        collectionAddress: req.body.collectionAddress,
      });
      if (checkCollectionAddress) {
        return res.status(400).json({
          error: true,
          status: 400,
          success: false,
          message: "Collection Address Already exist",
        });
      }
      const collection = new CollectionNFTs(req.body);
      const response = await collection.save();
      return res.status(201).json({
        data: response,
        status: 201,
        success: true,
        message: "Create Collection With Collection Address Successfully",
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        status: 400,
        success: false,
        message: "Failed To Create moralis Collection Address",
      });
    }
  },
  getMyCollectionListController: async (req, res) => {
    const { page, limit } = req.body;
    try {
      let userdata = req.userData;
      const getNftList = await Nfts.find({
        creator: userdata.account.toLowerCase(),
      });
      const getCollectionAddress = getNftList.map(
        (nft) => nft.collectionAddress
      );
      const getUniqueCollectionAddress = [...new Set(getCollectionAddress)];
      const filter = { collectionAddress: getUniqueCollectionAddress };
      const response = await CollectionNFTs.find(filter);
      const count = await CollectionNFTs.countDocuments(filter);
      let data = customPagination(response, page, limit, count);
      if (response.length) {
        return res.status(200).send({
          data: data,
          message: "Get All My Collections Successfully",
        });
      } else {
        return res.status(200).send({
          data: response,
          status: 200,
          success: true,
          message: "No My Collections Found",
        });
      }
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch My Collection",
      });
    }
  },
  getCollectionHeaders: async (req, res) => {
    const { collection_address } = req.body;
    try {
      const filter = { collectionAddress: collection_address, isActive: true };
      const nftsCount = await Nfts.count(filter);
      const nftsOwner = await Nfts.find(filter).select("owner price");
      const nftLowestPrice = await Nfts.findOne(filter)
        .sort({ price: 1 })
        .limit(1);

      let nftsOwnerIds = [];
      let nftsOwnerCount = 0;
      let totalVolume = 0;
      for (const iterator of nftsOwner) {
        if (!nftsOwnerIds.includes(iterator.owner)) {
          nftsOwnerIds.push(iterator.owner);
          nftsOwnerCount += 1;
        }
        totalVolume += iterator.price;
      }
      response = {
        items: nftsCount,
        owners: nftsOwnerCount,
        floorPrice: nftLowestPrice ? nftLowestPrice.price : 0,
        volumeTraded: totalVolume,
      };
      return res.status(200).send({
        data: response,
        status: 200,
        success: true,
        message: "Collections Headers Successfully",
      });
    } catch (err) {
      return res.status(400).send({
        error: err.message,
        status: 400,
        success: false,
        message: "Failed To Fetch Collection",
      });
    }
  },
};
