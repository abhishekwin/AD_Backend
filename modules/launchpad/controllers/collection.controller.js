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
} = require("../models");
const { Users } = require("../../../models");
const { getAdminAddress } = require("../../helpers/adminHelper");

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
    const result = await LaunchPadCollection.findOne({ _id: id }).populate(
      [
        {
          path: "isWhiteListed",
          match:{userAddress}
        },
        {
          path: "whiteListedUsers"
        }
        
      ]
    )
   const data = result.whiteListedUsers.map((data)=>data.userAddress);
   let response = result.toObject();
   response.whiteListedUsers = data;
    return res
      .status(200)
      .send(new ResponseObject(200, "Collection found successfully", response));
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
};

const verifyCollection = async (req, res) => {
  try {
    const { collectionAddress, userAddress, nonce } = req.body;
   
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
};

module.exports = {
  createCollection,
  updateCollection,
  updateCollectionWithNft,
  deleteCollection,
  getCollection,
  getCollectionList,
  approvedCollection,
  stashCollectionHeader,
};
