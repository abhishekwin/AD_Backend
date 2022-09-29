const httpStatus = require("http-status");
const pick = require("../../comman/pick");
const jwt_decode = require("jwt-decode");
// const ApiError = require('../../../utils/ApiError');
const catchAsync = require("../../../utils/catchAsync");
const ResponseObject = require("../../../utils/ResponseObject");
const { Collection } = require("../services");
const {
  LaunchPadCollection,
  LaunchPadNft,
  WhiteListedUser,
  LaunchPadTopCreator,
  LaunchPadMintHistory,
} = require("../models");
const { Users } = require("../../../models");
const { getAdminAddress } = require("../../helpers/adminHelper");
const customPagination = require("../../comman/customPagination");

const createCollection = catchAsync(async (req, res) => {
  const result = await Collection.createCollectionService(req.body);
  const collectionId = result._id;
  let WhiteListUser = [];
  for (userAddress of req.body.WhiteListedUser) {
    WhiteListUser.push({ collectionId, userAddress });
  }
  await WhiteListedUser.insertMany(WhiteListUser);
  res
    .status(200)
    .send(new ResponseObject(200, "Collection create successfully", result));
});

const updateCollection = async (req, res) => {
  try {
    const { collectionId, collectionAddress, owner, creator } = req.body;
    if (!collectionId) {
      return res
        .status(400)
        .send(new ResponseObject(400, "collectionId is required!"));
    }
    if (collectionAddress) {
      await LaunchPadNft.updateMany(
        { collectionId },
        { collectionAddress, owner, creator }
      );
    }
    const result = await LaunchPadCollection.findOneAndUpdate(
      { _id: collectionId },
      req.body,
      {
        new: true,
      }
    );
    return res
      .status(200)
      .send(new ResponseObject(200, "Collection update successfully"));
  } catch (error) {
    return res.status(500).send(new ResponseObject(500, error.message));
  }
};

const updateCollectionWithNft = async (req, res) => {
  try {
    const { collectionId } = req.body;
    const authenticateUser = await LaunchPadCollection.findOne({
      creator: req.userData.account.toLowerCase(),
    });
    if (!authenticateUser) {
      return res.status(400).send(new ResponseObject(400, "Invalid User"));
    }
    const result = await LaunchPadCollection.findOneAndUpdate(
      { _id: collectionId },
      req.body,
      {
        new: true,
      }
    );
    await LaunchPadNft.findOneAndUpdate(
      { collectionId: collectionId },
      { collectionAddress: req.body.collectionAddress }
    );
    return res
      .status(200)
      .send(new ResponseObject(200, "Collection update successfully"));
  } catch (error) {
    return res.status(500).send(new ResponseObject(500, error.message));
  }
};

const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const authenticateUser = await LaunchPadCollection.findOne({
      creator: req.userData.account.toLowerCase(),
    });
    if (!authenticateUser) {
      return res.status(400).send(new ResponseObject(400, "Invalid User"));
    }
    const result = await LaunchPadCollection.findByIdAndDelete({ _id: id });
    return res
      .status(200)
      .send(new ResponseObject(200, "Collection delete successfully"));
  } catch (error) {
    return res.status(500).send(new ResponseObject(500, error.message));
  }
};

const getCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { userAddress } = req.query;
    const result = await LaunchPadCollection.findOne({ _id: id }).populate([
      {
        path: "isWhiteListed",
        match: { userAddress },
      },
      {
        path: "whiteListedUsers",
        select: "userAddress",
      },
    ]);
    // let response = result;
    // if(result && result.whiteListedUsers){
    //    const data = result.whiteListedUsers?result.whiteListedUsers.map((data)=>data.userAddress):[];
    //   let response = result.toObject();
    //   response.whiteListedUsers = data;
    //   response.isWhiteListed = result.whiteListedUsers;
    // }
    return res
      .status(200)
      .send(new ResponseObject(200, "Collection found successfully", result));
  } catch (error) {
    return res.status(500).send(new ResponseObject(500, error.message));
  }
};

const getCollectionList = catchAsync(async (req, res) => {
  var filtercolumn = [];
  req.body.status = "completed";
  filtercolumn.push("status");
  if (req.body.approved || req.body.approved === false) {
    filtercolumn.push("approved");
  }
  if (req.body.owner) {
    filtercolumn.push("owner");
  }
  if (req.body.networkId && req.body.networkName) {
    filtercolumn.push("networkId", "networkName");
  }
  // if (req.body.post) {
  //   let search = await specialCharacter.specialCharacter(req.body.post);
  //   req.body.post = new RegExp('.*' + search + '.*', "i");
  //   filtercolumn.push('post');
  // }
  const filter = pick(req.body, filtercolumn);
  const options = pick(req.body, ["sortBy", "limit", "page"]);

  // const result = await NewsPostService.getNewsPost
  const result = await Collection.getLaunchPadCollectionList(
    filter,
    options,
    req
  );

  res
    .status(200)
    .send(new ResponseObject(200, "Collections display successfully", result));
});

const getMyCollectionList = catchAsync(async (req, res) => {
  var filtercolumn = [];
  
  // if (req.body.approved || req.body.approved === false) {
  //   filtercolumn.push("approved");
  // }
  if (req.body.status) {
    filtercolumn.push("status");
  }
  
  req.body.creator = req.userData.account.toLowerCase()
  filtercolumn.push("creator");
  
  if (req.body.networkId && req.body.networkName) {
    filtercolumn.push("networkId", "networkName");
  }
  // if (req.body.post) {
  //   let search = await specialCharacter.specialCharacter(req.body.post);
  //   req.body.post = new RegExp('.*' + search + '.*', "i");
  //   filtercolumn.push('post');
  // }
  const filter = pick(req.body, filtercolumn);
  const options = pick(req.body, ["sortBy", "limit", "page"]);

  // const result = await NewsPostService.getNewsPost
  const result = await Collection.getLaunchPadCollectionList(
    filter,
    options,
    req
  );

  res
    .status(200)
    .send(new ResponseObject(200, "Collections display successfully", result));
});

const approvedCollection = async (req, res) => {
  try {
    const { collectionId } = req.body;
    const bearerHeaders = req.headers["authorization"];
    if (typeof bearerHeaders !== "undefined") {
      const bearer = bearerHeaders.split(" ");
      const bearerToken = bearer[1];
      userdata = jwt_decode(bearerToken);
      userdata = await Users.findOne({ _id: userdata._id });
    }
    const isAdmin = await getAdminAddress(userdata.account);
    if (!isAdmin) {
      return res.status(400).json({
        error: true,
        status: 400,
        success: false,
        message: "You don't have permission",
      });
    }
    const result = await LaunchPadCollection.findOneAndUpdate(
      { _id: collectionId },
      { approved: true },
      { new: true }
    );
    res
      .status(200)
      .send(
        new ResponseObject(200, "Approved collection successfully", result)
      );
  } catch (error) {
    return res.status(500).send(new ResponseObject(500, error.message));
  }
};

const stashCollectionHeader = async (req, res) => {
  const { collectionAddress } = req.body;
  try {
    const filter = { collectionAddress, isActive: true };
    const nftsCount = await LaunchPadNft.count(filter);
    const nftsOwner = await LaunchPadNft.find(filter).select("owner price");
    const nftLowestPrice = await LaunchPadNft.findOne(filter)
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
    return res
      .status(200)
      .send(
        new ResponseObject(
          200,
          "Get Collections Headers Successfully",
          response
        )
      );
  } catch (err) {
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

const stashAllCollectionHeader = async (req, res) => {
  try {
    const filter = { };
    const nftsCount = await LaunchPadNft.count(filter);
    const nftsOwner = await LaunchPadNft.find(filter).select("owner price");
    const nftLowestPrice = await LaunchPadNft.findOne(filter)
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
    return res
      .status(200)
      .send(
        new ResponseObject(
          200,
          "Get All Collections Headers Successfully",
          response
        )
      );
  } catch (err) {
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

const topCreator = async (req, res) => {
  try {
    const getCollectionAddress = await LaunchPadMintHistory.aggregate([
      { $group: { _id: "$collectionAddress", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    let collectionAddress = [];
    for (item of getCollectionAddress) {
      item._id ? collectionAddress.push(item._id) : 0;
    }
    const getCreator = await LaunchPadCollection.find({
      collectionAddress: { $in: collectionAddress },
    });
    let creator = []
    for (item of getCreator) {
      item.creator ? creator.push(item.creator) : 0;
    }
    const getUsers = await Users.find({
      account: { $in: creator },
    });
    return res
      .status(200)
      .send(new ResponseObject(200, "Get Top Creator Successfully", getUsers));
  } catch (err) {
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

const getLatestCreator = async (req, res) => {
  try {
    const lanchpadCollection = await LaunchPadCollection.find({
      approved: true,
    }).sort({ created_at: -1 });
    let creator = lanchpadCollection.map((item) => {
      if (item.creator != null) {
        return item.creator;
      }
      return null;
    });
    creator = [...new Set(creator)];
    const findLatestCreator = await Users.find({
      account: { $in: creator },
    }).limit(5);
    return res
      .status(200)
      .send(
        new ResponseObject(
          200,
          "Get Latest Creator Successfully",
          findLatestCreator
        )
      );
  } catch (err) {
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

const getTopSellers = async (req, res) => {
  try {
    const findTopSellers = await Users.find().limit(5);
    return res
      .status(200)
      .send(
        new ResponseObject(200, "Get Top Sellers Successfully", findTopSellers)
      );
  } catch (err) {
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

const getTopBuyers = async (req, res) => {
  try {
    const findTopBuyers = await Users.find().limit(5);
    return res
      .status(200)
      .send(
        new ResponseObject(200, "Get Top Buyers Successfully", findTopBuyers)
      );
  } catch (err) {
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

const addTopCreator = async (req, res) => {
  try {
    const { userAddresses } = req.body;

    await LaunchPadTopCreator.deleteMany();
    for (userAccountAddress of userAddresses) {
      await LaunchPadTopCreator.create({ userAccountAddress });
    }
    return res
      .status(200)
      .send(new ResponseObject(200, "Top Creator Added Successfully", []));
  } catch (err) {
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};
const collectionCreatorUsers = async (req, res) => {
  try {
    const { page, limit } = req.body;
    const findCreator = await LaunchPadCollection.find();
    let creator = findCreator.map((item) => {
      if (item.creator != null) {
        return item.creator;
      }
      return;
    });
    creator = [...new Set(creator)];
    const tableData = await Users.find({ account: { $in: creator } })
    .populate([
      {
        path:"isSelected",
        
      }
    ])
      // .sort({ [sort_by_name]: sort_by_order })
      .skip((page - 1) * limit)
      .limit(limit);

    const row_count = await Users.count({ account: { $in: creator } })
    
    const result = customPagination.customPagination(
      tableData,
      page,
      limit,
      row_count
    );
    return res
      .status(200)
      .send(
        new ResponseObject(
          200,
          "Get Collection Creator Users Successfully",
          result
        )
      );
  } catch (err) {
    console.log("error", err);
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

module.exports = {
  createCollection,
  updateCollection,
  updateCollectionWithNft,
  deleteCollection,
  getCollection,
  getCollectionList,
  getMyCollectionList,
  approvedCollection,
  stashCollectionHeader,
  topCreator,
  stashAllCollectionHeader,
  getLatestCreator,
  getTopSellers,
  getTopBuyers,
  addTopCreator,
  collectionCreatorUsers,
};
