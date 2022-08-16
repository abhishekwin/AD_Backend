const httpStatus = require('http-status');
// const pick = require('../../../utils/pick');
// const ApiError = require('../../../utils/ApiError');
const catchAsync = require('../../../utils/catchAsync');
const ResponseObject = require('../../../utils/ResponseObject');
const { Collection } = require('../services');

const createCollection = catchAsync(async (req, res) => {
  const result = await Collection.createCollectionService(req.body);
  res.status(200).send(new ResponseObject(200,  "Collection create successfully",
    result
  ));
});

module.exports = {
  createCollection
};
