const httpStatus = require("http-status");
const pick = require('../../comman/pick');
// const ApiError = require('../../../utils/ApiError');
const catchAsync = require("../../../utils/catchAsync");
const ResponseObject = require("../../../utils/ResponseObject");
const { Collection } = require("../services");
const { LaunchPadCollection, LaunchPadNft } = require('../models');

const createCollection = catchAsync(async (req, res) => {
  const result = await Collection.createCollectionService(req.body);
  res
    .status(200)
    .send(new ResponseObject(200, "Collection create successfully", result));
});

const updateCollection = async (req, res) => {
  try {
    const { collectionId } = req.body;
    if(!collectionId){
      return res.status(400).send(new ResponseObject(400, "collectionId is required!"));
    }
    const result = await LaunchPadCollection.findOneAndUpdate({ _id : collectionId }, req.body, {
      new: true,
    });
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
    const result = await LaunchPadCollection.findOneAndUpdate({ _id : collectionId }, req.body, {
      new: true,
    });
    await LaunchPadNft.findOneAndUpdate({ collectionId : collectionId }, {collectionAddress : req.body.collectionAddress});
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
    const result = await LaunchPadCollection.findByIdAndDelete({ _id : id });
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
    const result = await LaunchPadCollection.findById({ _id : id });
    return res
      .status(200)
      .send(new ResponseObject(200, "Collection find successfully",result));
  } catch (error) {
    return res.status(500).send(new ResponseObject(500, error.message));
  }
};

const getCollectionList = catchAsync(async (req, res) => {
  var filtercolumn = [];
  filtercolumn.push('status');
  if (req.body.company_id) {
    filtercolumn.push('company_id');
  }

  // if (req.body.post) {
  //   let search = await specialCharacter.specialCharacter(req.body.post);
  //   req.body.post = new RegExp('.*' + search + '.*', "i");
  //   filtercolumn.push('post');
  // }

  const filter = pick(req.body, filtercolumn);
  const options = pick(req.body, ['sortBy', 'limit', 'page']);

  // const result = await NewsPostService.getNewsPost
  const result = await Collection.getLaunchPadCollectionList(filter, options, req);

  res.status(200).send(new ResponseObject(200, "Collections display successfully",
    result
  ));
});


module.exports = {
  createCollection,
  updateCollection,
  updateCollectionWithNft,
  deleteCollection,
  getCollection,
  getCollectionList
};
