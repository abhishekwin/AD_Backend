const httpStatus = require("http-status");
const pick = require("../../comman/pick");
const axios = require("axios");
const jwt_decode = require("jwt-decode");
// const ApiError = require('../../../utils/ApiError');
const catchAsync = require("../../../utils/catchAsync");
const ResponseObject = require("../../../utils/ResponseObject");
const { Collection } = require("../services");
const { getUTCDate, createUTCDate } = require("../../helpers/timezone")

const {
  LaunchPadCollection,
  LaunchPadNft,
  WhiteListedUser,
  LaunchPadTopCreator,
  LaunchPadMintHistory,
  LaunchPadCoolTime,
  LaunchPadAdminSetting,
  LaunchPadCurrency,
  LaunchPadCollectionPhase,
  LaunchPadCollectionCurrencyDetailsForWhiteListed,
  LaunchPadCollectionCurrencyDetails
} = require("../models");

// const {LaunchPadCollectionPhase } = require("../models/collectionPhase.model");
const { Users } = require("../../../models");
const { getAdminAddress } = require("../../helpers/adminHelper");
const customPagination = require("../../comman/customPagination");
const { specialCharacter } = require("../../../helpers/RegexHelper");


const getBaseWebData = async (url) => {
  try {
    const result = await axios.get(url);
    if (result.status == 200) {
      return result.data;
    }
  } catch (e) {
    return null;
  }
}

const createNftWithTokenUri = async (data) => {

  let failedNfts = [];
  for (let step = 1; step <= data.maxSupply; step++) {
    const id = step
    updateUri = data.tokenURI + id + ".json";
    baseResponse = await getBaseWebData(updateUri);
    if (baseResponse) {
      let objNfts = {
        collectionId: data._id,
        collectionAddress: data.collectionAddress,
        royalties: data.royalties ? data.royalties : 0,
        name: baseResponse.name,
        description: baseResponse.description,
        image: baseResponse.image,
        tokenURI: updateUri ? updateUri : null,
        owner: data.creator,
        creator: data.creator,
        tokenId: id,
        // dna: baseResponse.dna,
        attributes: baseResponse.attributes,
        compiler: baseResponse.compiler,
        currency: data.currency,
        isFirstSale: true,
        mintCost: data.mintCost,
        royalties: data.royalties,
        status: "Active",
        isActive: true,
        networkId: data.networkId,
        networkName: data.networkName,
      };

      let existNfts = await LaunchPadNft.findOne({
        collectionId: data._id,
        tokenId: id
      });

      if (existNfts) {
        await LaunchPadNft.findOneAndUpdate({ collectionId: data._id, tokenId: id }, objNfts)
      } else {
        await LaunchPadNft.create(objNfts)
      }
    } else {
      failedNfts.push(id)
    }
  }
  await LaunchPadCollection.findOneAndUpdate({ _id: data._id }, { status: "completed", failedNfts: failedNfts })
}

const createCollection = catchAsync(async (req, res) => {
  // const findCoolTime = await LaunchPadCoolTime.findOne({
  //   userAddress: req.userData.account.toLowerCase(),
  // });
  // const findTime = await LaunchPadAdminSetting.findOne({
  //   type: "createCollection",
  // });
  // if (findTime) {
  //   let time = 0;
  //   if (findTime?.settingData?.coolTime) {
  //     time = findTime.settingData.coolTime
  //   }
  //   if (time) {
  //     let currentDate = new Date();
  //     currentDate = new Date(currentDate.getTime() + time * 60 * 1000)
  //     if (new Date() < currentDate) {
  //       return res
  //         .status(400)
  //         .send(new ResponseObject(400, "Please Wait SomeTime"));
  //     }
  //   }
  // }

  //validation 
  if(req.body.currencyDetails.length > 0){
    for (currencyDetail of req.body.currencyDetails) {
      let result = await LaunchPadCurrency.findOne({
        name:currencyDetail.currency,
        address:currencyDetail.address,
        symbol:currencyDetail.symbol,
      })
      
      if(!result){
        return res
        .status(400)
        .send(new ResponseObject(400, "Currency not exist"));
      }
    }
  }
  if(req.body.currencyDetailsForWhiteListed.length > 0){
    for (currencyWhiteListedDetail of req.body.currencyDetailsForWhiteListed) {
      let result = await LaunchPadCurrency.findOne({
        name:currencyWhiteListedDetail.currency,
        address:currencyWhiteListedDetail.address,
        symbol:currencyWhiteListedDetail.symbol,
      })
      
      if(!result){
        return res
        .status(400)
        .send(new ResponseObject(400, "Currency not exist"));
      }
    }
  }
 
  req.body.creator = req.userData.account;
  const result = await Collection.createCollectionService(req.body);
  const collectionId = result._id;
  // if (findCoolTime) {
  //   findCoolTime.collectionAddress = result.collectionAddress;
  //   findCoolTime.time = new Date();
  //   await findCoolTime.save();
  // } else {
  //   await LaunchPadCoolTime.create({
  //     userAddress: req.userData.account,
  //     collectionAddress: result.collectionAddress,
  //     type: "createCollection",
  //     time: new Date(),
  //   });
  // }
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
    // if(req.body.startDate){
    //   req.body.startDate = await createUTCDate(req.body.startDate)
    // }
    // if(endDate){
    //   req.body.endDate = await createUTCDate(req.body.endDate)
    // }
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

const updateCollectionWithCreateNft = async (req, res) => {
  try {
    const { collectionId, collectionAddress } = req.body;
    if (!collectionId) {
      return res
        .status(400)
        .send(new ResponseObject(400, "collectionId is required!"));
    }


    const result = await LaunchPadCollection.findOneAndUpdate(
      { _id: collectionId },
      req.body
    );

    // const collectionDetails = await LaunchPadCollection.findOne({ _id: collectionId });
    // if(collectionDetails){
    //   if(collectionDetails.maxSupply < 200){
    //     await LaunchPadCollection.findOneAndUpdate({ _id: collectionDetails._id }, { status: "syncing" })
    //     await createNftWithTokenUri(collectionDetails);
    //     await LaunchPadCollection.findOneAndUpdate({ _id: collectionDetails._id }, { status: "completed" })
    //   }      
    // }


    return res
      .status(200)
      .send(new ResponseObject(200, "Collection update successfully"));
  } catch (error) {
    console.log("error", error)
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
    const lanchpadCollection = await LaunchPadCollection.findOne({ _id: id });
    if (lanchpadCollection) {
      const mintHistory = await LaunchPadMintHistory.findOne({ collectionAddress: lanchpadCollection.collectionAddress });
      if (mintHistory) {
        return res
          .status(400)
          .send(new ResponseObject(400, "Minted collection can't be deleted"));
      }
      if (lanchpadCollection.status == "completed") {
        return res
          .status(400)
          .send(new ResponseObject(400, "Completed collection can't be deleted"));
      }
    }
    const result = await LaunchPadCollection.findOneAndUpdate({ _id: id, status: "in-progress" }, { deletedAt: new Date() });
    if (result) {
      await LaunchPadNft.updateMany({ collectionId: result._id }, { deletedAt: new Date() })
    }

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
    let { userAddress } = req.query;
    userAddress = userAddress.toLowerCase();
    const resultFirst = await LaunchPadCollection.findOne({ _id: id }).populate([
      {
        path: "isWhiteListed",
        match: { userAddress },
      },
      {
        path: "whiteListedUsers",
        select: "userAddress",
      },
    ])
    const result = await LaunchPadCollection.findOne({ _id: id }).populate([
      {
        path: "isWhiteListed",
        match: { userAddress },
      },
      {
        path: "whiteListedUsers",
        select: "userAddress",
      },
      {
        path: "userMintCount",
        match: { userAddress }
      },
      {
        path: "nftCount",
      },
      {
        path: "phases",
        populate:[{
          path: "currencyDetails",
        }]
      },
    ]).lean().select('-tokenURI');

    if (result && result.isWhiteListed) {
      if (result.endDate <= await getUTCDate()) {
        result.isWhiteListed = 0;
      }
    }

    if (resultFirst && resultFirst.whiteListedUsersInArray) {
      result.whiteListedUsersInArray = resultFirst.whiteListedUsersInArray
    }
    return res
      .status(200)
      .send(new ResponseObject(200, "Collection found successfully", result));
  } catch (error) {
    return res.status(500).send(new ResponseObject(500, error.message));
  }
};

const getCollectionList = catchAsync(async (req, res) => {
  var filtercolumn = [];

  req.body.deletedAt = null
  filtercolumn.push("deletedAt");

  req.body.collectionAddress = { $ne: null }
  filtercolumn.push("collectionAddress");

  req.body.status = ["completed", "ready-to-syncup", "syncing"];
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
  if (req.body.searchText) {
    let search = await specialCharacter(req.body.searchText);
    search = new RegExp(".*" + search + ".*", "i");
    req.body.$or = [{ collectionName: search }, { symbol: search }];
    filtercolumn.push("$or");
  }
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

const upcomingCollectionList = catchAsync(async (req, res) => {
  var filtercolumn = [];

  req.body.deletedAt = null
  filtercolumn.push("deletedAt");

  req.body.collectionAddress = { $ne: null }
  filtercolumn.push("collectionAddress");

  // req.body.endDate = {$lt: new Date()}
  // filtercolumn.push("endDate");

  req.body.status = "completed";
  filtercolumn.push("status");

  req.body.approved = true;
  filtercolumn.push("approved");

  // if (req.body.owner) {
  //   filtercolumn.push("owner");
  // }
  if (req.body.networkId && req.body.networkName) {
    filtercolumn.push("networkId", "networkName");
  }

  req.body.startDate = { $gt: await getUTCDate() };
  filtercolumn.push("startDate")

  if (req.body.searchText) {
    let search = await specialCharacter(req.body.searchText);
    search = new RegExp(".*" + search + ".*", "i");
    req.body.$or = [{ collectionName: search }, { symbol: search }];
    filtercolumn.push("$or");
  }

  const filter = pick(req.body, filtercolumn);
  const options = pick(req.body, ["sortBy", "limit", "page"]);

  // const result = await NewsPostService.getNewsPost
  const result = await Collection.getLaunchPadCollectionList(
    filter,
    options,
    req
  );

  const response = {
    type: "upcoming",
    result: result
  }

  res
    .status(200)
    .send(new ResponseObject(200, "Collections display successfully", response));
});

const liveCollectionList = catchAsync(async (req, res) => {
  var filtercolumn = [];

  req.body.deletedAt = null
  filtercolumn.push("deletedAt");

  req.body.collectionAddress = { $ne: null }
  filtercolumn.push("collectionAddress");

  req.body.status = "completed";
  filtercolumn.push("status");
  req.body.approved = true;
  filtercolumn.push("approved");
  if (req.body.owner) {
    filtercolumn.push("owner");
  }
  if (req.body.networkId && req.body.networkName) {
    filtercolumn.push("networkId", "networkName");
  }

  // let orArray = [{startDate: {$lte: await getUTCDate()}}, {startDate: null}];
  // if (req.body.searchText) {
  //   let search = await specialCharacter(req.body.searchText);
  //   search = new RegExp(".*" + search + ".*", "i");
  //   orArray.push(...[{ collectionName: search }, { symbol: search }]);
  // }

  // req.body.$or = orArray;
  // filtercolumn.push("$or");

  let orArray = [
    {
      "$or": [{ startDate: { $lte: await getUTCDate() } }, { startDate: null }]
    }
  ];
  if (req.body.searchText) {
    let search = await specialCharacter(req.body.searchText);
    search = new RegExp(".*" + search + ".*", "i");
    //orArray.push(...[{ collectionName: search }, { symbol: search }]);
    orArray.push({ "$or": [{ collectionName: search }, { symbol: search }] })
  }

  req.body.$and = orArray;
  filtercolumn.push("$and");

  const filter = pick(req.body, filtercolumn);
  const options = pick(req.body, ["sortBy", "limit", "page"]);

  // const result = await NewsPostService.getNewsPost
  const result = await Collection.getLaunchPadLiveCollectionList(
    filter,
    options,
    req
  );

  const response = {
    type: "live",
    result: result
  }

  res
    .status(200)
    .send(new ResponseObject(200, "Collections display successfully", response));
});

const endCollectionList = catchAsync(async (req, res) => {
  var filtercolumn = [];

  req.body.deletedAt = null
  filtercolumn.push("deletedAt");

  req.body.status = "ended";
  filtercolumn.push("status");

  req.body.collectionAddress = { $ne: null }
  filtercolumn.push("collectionAddress");

  req.body.approved = true;
  filtercolumn.push("approved");
  if (req.body.owner) {
    filtercolumn.push("owner");
  }
  if (req.body.networkId && req.body.networkName) {
    filtercolumn.push("networkId", "networkName");
  }
  if (req.body.searchText) {
    let search = await specialCharacter(req.body.searchText);
    search = new RegExp(".*" + search + ".*", "i");
    req.body.$or = [{ collectionName: search }, { symbol: search }];
    filtercolumn.push("$or");
  }
  const filter = pick(req.body, filtercolumn);
  const options = pick(req.body, ["sortBy", "limit", "page"]);

  // const result = await NewsPostService.getNewsPost
  const result = await Collection.getLaunchPadEndCollectionList(
    filter,
    options,
    req
  );

  const response = {
    type: "ended",
    result: result
  }

  res
    .status(200)
    .send(new ResponseObject(200, "Collections display successfully", response));
});


const getMyCollectionList = catchAsync(async (req, res) => {
  var filtercolumn = [];

  req.body.deletedAt = null
  filtercolumn.push("deletedAt");

  req.body.collectionAddress = { $ne: null }
  filtercolumn.push("collectionAddress");

  let statusOrFilter = [{ status: "completed" }, { status: "ended" }, { status: "ready-to-syncup" }, { status: "syncing" }]

  req.body.creator = req.userData.account.toLowerCase();
  filtercolumn.push("creator");

  if (req.body.networkId && req.body.networkName) {
    filtercolumn.push("networkId", "networkName");
  }
  let searchObj = {};
  if (req.body.searchText) {
    let search = await specialCharacter(req.body.searchText);
    search = new RegExp(".*" + search + ".*", "i");
    searchObj = { "$or": [{ collectionName: search }, { symbol: search }] }
  }

  req.body.$and = [{ "$or": statusOrFilter }]
  if (searchObj) {
    req.body.$and.push(searchObj)
  }
  filtercolumn.push("$and");
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
      { approved: true, status: "completed" },
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
    const filter = { collectionAddress, isActive: true, collectionAddress: { $ne: null } };
    const nftsCount = await LaunchPadNft.count(filter);
    const nftsOwner = await LaunchPadNft.find(filter).select("owner mintCost");
    const nftLowestPrice = await LaunchPadNft.findOne({ ...filter, ...{ mintCost: { $ne: null } } })
      .sort({ mintCost: 1 })
      .limit(1);

    let nftsOwnerIds = [];
    let nftsOwnerCount = 0;
    let totalVolume = 0;
    for (const iterator of nftsOwner) {
      if (!nftsOwnerIds.includes(iterator.owner)) {
        nftsOwnerIds.push(iterator.owner);
        nftsOwnerCount += 1;
      }
      totalVolume += iterator.mintCost;
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
    const filter = {};
    const nftsCount = await LaunchPadNft.count(filter);
    const nftsOwner = await LaunchPadNft.find(filter).select("owner mintCost");
    const launchPadCollection = await LaunchPadCollection.count({ approved: true, deletedAt: null });
    const nftLowestPrice = await LaunchPadNft.findOne({ mintCost: { $ne: null }, collectionAddress: { $ne: null } })
      .sort({ mintCost: 1 })
      .limit(1);

    let nftsOwnerIds = [];
    let nftsOwnerCount = 0;
    // let totalVolume = 0;
    // for (const iterator of nftsOwner) {
    //   if (!nftsOwnerIds.includes(iterator.owner)) {
    //     nftsOwnerIds.push(iterator.owner);
    //     nftsOwnerCount += 1;
    //   }
    //   totalVolume += iterator.mintCost;
    // }
    response = {
      items: nftsCount,
      owners: nftsOwnerCount,
      floorPrice: nftLowestPrice ? nftLowestPrice.mintCost : 0,
      volumeTraded: launchPadCollection,
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


const getStatsWithMultiFilter = async (req, res) => {
  try {
    const { networkId } = req.body
    let filter = { approved: true, deletedAt: null };
    if (networkId) {
      filter = { ...filter, networkId: networkId }
    }
    const launchPadCollection = await LaunchPadCollection.find(filter).populate([{
      path: 'nfts'
    }])

    let response = [];
    let count = 0;
    for (const iterator of launchPadCollection) {
      response.push({
        contractName: iterator.contractName,
        tokenURI: iterator.tokenURI,
        imageCover: iterator.imageCover,
        bannerImages: iterator.bannerImages
      })
    }

    return res
      .status(200)
      .send(
        new ResponseObject(
          200,
          "Get stash collection with filter",
          response
        )
      );
  } catch (err) {
    console.log("err", err)
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

const topCreator = async (req, res) => {
  try {
    const getCollectionAddress = await LaunchPadTopCreator.find();
    let creator = [];
    for (item of getCollectionAddress) {
      item.userAccountAddress ? creator.push(item.userAccountAddress) : 0;
    }
    const getUsers = await Users.find({
      account: { $in: creator },
    }).limit(4);
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
    }).limit(4);
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

const getLatestCollection = async (req, res) => {
  try {
    let filter = {
      approved: true,
      collectionAddress: { $ne: null },
      deletedAt: null,
    }
    if (req.body.networkId && req.body.networkName) {
      filter = {
        approved: true,
        collectionAddress: { $ne: null },
        deletedAt: null,
        networkId: req.body.networkId,
        networkName: req.body.networkName
      }
    }
    const lanchpadCollection = await LaunchPadCollection.find(filter).select('-tokenURI').sort({ created_at: -1 }).limit(4);
    // let creator = lanchpadCollection.map((item) => {
    //   if (item.creator != null) {
    //     return item.creator;
    //   }
    //   return null;
    // });
    // creator = [...new Set(creator)];
    // const findLatestCreator = await Users.find({
    //   account: { $in: creator },
    // }).limit(6);
    return res
      .status(200)
      .send(
        new ResponseObject(
          200,
          "Get Latest Collection Successfully",
          lanchpadCollection
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
    let creator = [];
    for (item of getCreator) {
      item.creator ? creator.push(item.creator) : 0;
    }
    const getUsers = await Users.find({
      account: { $in: creator },
    }).limit(4);
    return res
      .status(200)
      .send(new ResponseObject(200, "Get Top Creator Successfully", getUsers));
  } catch (err) {
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};

const getTopBuyers = async (req, res) => {
  try {
    const getUserAddress = await LaunchPadMintHistory.aggregate([
      { $group: { _id: "$userAddress", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    let creator = [];
    for (item of getUserAddress) {
      item._id ? creator.push(item._id) : 0;
    }
    const getUsers = await Users.find({
      account: { $in: creator },
    }).limit(4);
    return res
      .status(200)
      .send(new ResponseObject(200, "Get Top Creator Successfully", getUsers));
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
          path: "isSelected",
        },
      ])
      // .sort({ [sort_by_name]: sort_by_order })
      .skip((page - 1) * limit)
      .limit(limit);

    const row_count = await Users.count({ account: { $in: creator } });

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
    return res
      .status(500)
      .send(new ResponseObject(500, "Something Went Wrong"));
  }
};


// const createStaticCollection = catchAsync(async (req, res) => {
//   const result = await LaunchPadCollection.create(req.body)
//   res
//     .status(200)
//     .send(new ResponseObject(200, "Collection created successfully", result));
// });

// const updateStaticCollection = catchAsync(async (req, res) => {
//   const id = req.body.id
//   delete req.body.id;
//   const result = await LaunchPadCollection.findOneAndUpdate({_id:id}, req.body, {
//     new: true
//   })
//   res
//     .status(200)
//     .send(new ResponseObject(200, "Collection updated successfully", result));
// });

const getUserLatestCollection = catchAsync(async (req, res) => {
  let userAddress = req.userData.account.toLowerCase();
  const result = await LaunchPadCollection.findOne({ creator: userAddress, deletedAt: null, status: "in-progress" }).sort({ created_at: -1 })
  res
    .status(200)
    .send(new ResponseObject(200, "Collection display successfully", result));
});

const getCollectionMintCount = catchAsync(async (req, res) => {
  const { collectionId, userAddress } = req.body;
  if (!collectionId) {
    return res
      .status(400)
      .send(new ResponseObject(400, "Collection id is required"));
  }
  // if(!userAddress){
  //   return res
  //         .status(400)
  //         .send(new ResponseObject(400, "User address is required"));
  // }
  const result = await LaunchPadCollection.findOne({ _id: collectionId })
    .select('nftMintCount collectionAddress')
    .populate([
      {
        path: "userMintCount",
        match: { userAddress }
      }
    ])
  res
    .status(200)
    .send(new ResponseObject(200, "Collection display successfully", result));
});


const getAllCollectionForAdmin = catchAsync(async (req, res) => {
  var filtercolumn = [];

  req.body.deletedAt = null
  filtercolumn.push("deletedAt");

  req.body.collectionAddress = { $ne: null }
  filtercolumn.push("collectionAddress");

  // req.body.status = ["completed", "ready-to-syncup", "syncing", "ended"];
  // filtercolumn.push("status");
  if (req.body.status) {
    filtercolumn.push("status");
  }
  if (req.body.approved || req.body.approved === false) {
    filtercolumn.push("approved");
  }

  if (req.body.networkId && req.body.networkName) {
    filtercolumn.push("networkId", "networkName");
  }
  if (req.body.searchText) {
    let search = await specialCharacter(req.body.searchText);
    search = new RegExp(".*" + search + ".*", "i");
    req.body.$or = [{ collectionName: search }, { symbol: search }];
    filtercolumn.push("$or");
  }
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

const getHideCollection = catchAsync(async (req, res) => {
  // let userAddress = req.userData.account.toLowerCase();
  var filtercolumn = [];

  req.body.deletedAt = { $ne: null }
  filtercolumn.push("deletedAt");

  req.body.hideByAdmin = { $ne: null }
  filtercolumn.push("hideByAdmin");

  if (req.body.status) {
    filtercolumn.push("status");
  }

  if (req.body.networkId && req.body.networkName) {
    filtercolumn.push("networkId", "networkName");
  }

  const filter = pick(req.body, filtercolumn);
  const options = pick(req.body, ["sortBy", "limit", "page"]);

  // const result = await NewsPostService.getNewsPost
  const result = await Collection.getHideCollectionList(
    filter,
    options,
    req
  );

  res
    .status(200)
    .send(new ResponseObject(200, "Hide collection display successfully", result));
});

const getFailedCollection = catchAsync(async (req, res) => {
  // let userAddress = req.userData.account.toLowerCase();
  var filtercolumn = [];

  req.body.deletedAt = { $ne: null }
  filtercolumn.push("deletedAt");

  // req.body.hideByAdmin = {$ne:null}
  // filtercolumn.push("hideByAdmin");

  if (req.body.status) {
    filtercolumn.push("status");
  }

  if (req.body.approved || req.body.approved === false) {
    filtercolumn.push("approved");
  }

  if (req.body.networkId && req.body.networkName) {
    filtercolumn.push("networkId", "networkName");
  }

  const filter = pick(req.body, filtercolumn);
  const options = pick(req.body, ["sortBy", "limit", "page"]);

  // const result = await NewsPostService.getNewsPost
  const result = await Collection.getFailedCollectionList(
    filter,
    options,
    req
  );

  res
    .status(200)
    .send(new ResponseObject(200, "Hide collection display successfully", result));
});

const hideMultipuleCollection = catchAsync(async (req, res) => {
  const userAddress = req.userData.account.toLowerCase();
  const { collectionIds } = req.body
  if (!collectionIds.length > 0) {
    return res
      .status(400)
      .send(new ResponseObject(400, "Please provide collection ids"));
  }
  await LaunchPadCollection.updateMany({ _id: collectionIds }, { deletedAt: new Date, hideByAdmin: userAddress })
  res
    .status(200)
    .send(new ResponseObject(200, "Collection hide successfully", collectionIds));
});

const unHideMultipuleCollection = catchAsync(async (req, res) => {
  const userAddress = req.userData.account.toLowerCase();
  const { collectionIds } = req.body
  if (!collectionIds.length > 0) {
    return res
      .status(400)
      .send(new ResponseObject(400, "Please provide collection ids"));
  }
  await LaunchPadCollection.updateMany({ _id: collectionIds }, { deletedAt: null, unHideByAdmin: userAddress })
  res
    .status(200)
    .send(new ResponseObject(200, "Collection unhide successfully", collectionIds));
});

const getBaseUri = catchAsync(async (req, res) => {
  const userAddress = req.userData.account.toLowerCase();
  let { networkId, collectionAddress } = req.body
  collectionAddress = collectionAddress.toLowerCase()
  let result = await LaunchPadCollection.findOne({ networkId: networkId, collectionAddress:collectionAddress, creator:userAddress }).select('tokenURI')
  if(!result){
    return res
      .status(400)
      .send(new ResponseObject(400, "Collection not found"));
  }
  await LaunchPadCollection.findOneAndUpdate({ networkId: networkId, collectionAddress:collectionAddress, creator:userAddress }, {isReveal:true})
  const response = {
    baseUri:result.tokenURI
  } 
  res
    .status(200)
    .send(new ResponseObject(200, "Collection unhide successfully", response));
});

module.exports = {
  createCollection,
  updateCollection,
  updateCollectionWithCreateNft,
  updateCollectionWithNft,
  deleteCollection,
  getCollection,
  getCollectionList,
  upcomingCollectionList,
  liveCollectionList,
  endCollectionList,
  getMyCollectionList,
  approvedCollection,
  stashCollectionHeader,
  topCreator,
  stashAllCollectionHeader,
  getLatestCreator,
  getLatestCollection,
  getTopSellers,
  getTopBuyers,
  addTopCreator,
  collectionCreatorUsers,
  // createStaticCollection,
  // updateStaticCollection,
  getUserLatestCollection,
  getCollectionMintCount,
  getHideCollection,
  getFailedCollection,
  hideMultipuleCollection,
  unHideMultipuleCollection,
  getAllCollectionForAdmin,
  getStatsWithMultiFilter,
  getBaseUri
};
