const httpStatus = require('http-status');
const { LaunchPadCollection } = require('../models');
const customPagination = require('../../comman/customPagination');
// const CustomPaginationHelper = require('../../../Helpers/CustomPagination');

/**
 * Create a sportlight post
 * @param {Object} cityBody
 * @returns {Promise<User>}
 */
const createCollectionService = async (reqBody) => {
  const createpost = await LaunchPadCollection.create(reqBody);
  return createpost;
};

/**
 * Query for community
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const getLaunchPadCollectionList = async (filter, options, req) => {
  let page = options.page;
  let limit = options.limit;
  let sort_by_name = options.sortBy ? options.sortBy.name : "";
  let sort_by_order = options.sortBy ? options.sortBy.order : "";
  // console.log("filter", JSON.stringify(filter, null, 4))
  const tableData = await LaunchPadCollection.find(filter)
    .populate([
      {
        path: "nftCount",
      },
      {
        path: "phases",
        populate: [{
          path: "currencyDetails",
        }, {
          path: "whiteListedUser",
        }]
      }
    ])
    .sort({ [sort_by_name]: sort_by_order })
    .skip((page - 1) * limit)
    .limit(limit).select('-tokenURI');

  const row_count = await LaunchPadCollection.count(filter);

  const result = customPagination.customPagination(tableData, page, limit, row_count);

  return result;
};

const getLaunchPadLiveCollectionList = async (filter, options, req) => {
  let page = options.page;
  let limit = options.limit;
  let sort_by_name = options.sortBy ? options.sortBy.name : "";
  let sort_by_order = options.sortBy ? options.sortBy.order : "";

  // console.log("filter", filter)
  const tableData = await LaunchPadCollection.find(filter)
    .sort({ [sort_by_name]: sort_by_order })
    .populate([
      {
        path: "phases",
        populate: [{
          path: "currencyDetails",
        }, {
          path: "whiteListedUser",
        }]
      },
    ])
    .skip((page - 1) * limit)
    .limit(limit).select('-tokenURI');

  const row_count = await LaunchPadCollection.count(filter);

  const result = customPagination.customPagination(tableData, page, limit, row_count);

  return result;
};

const getLaunchPadEndCollectionList = async (filter, options, req) => {
  let page = options.page;
  let limit = options.limit;
  let sort_by_name = options.sortBy ? options.sortBy.name : "";
  let sort_by_order = options.sortBy ? options.sortBy.order : "";

  //const endCollectionData = await LaunchPadCollection.find({ $expr: { $gte: [ "$nftMintCount" , "$maxSupply" ] } });
  let collectionIds = []
  const tableData = await LaunchPadCollection.find(filter)
    .sort({ [sort_by_name]: sort_by_order })
    .populate([
      {
        path: "phases",
        populate: [{
          path: "currencyDetails",
        }, {
          path: "whiteListedUser",
        }]
      },
    ])
    .skip((page - 1) * limit)
    .limit(limit).select('-tokenURI');

  const row_count = await LaunchPadCollection.count(filter);

  const result = customPagination.customPagination(tableData, page, limit, row_count);

  return result;
};

const getHideCollectionList = async (filter, options, req) => {
  let page = options.page;
  let limit = options.limit;
  let sort_by_name = options.sortBy ? options.sortBy.name : "";
  let sort_by_order = options.sortBy ? options.sortBy.order : "";

  //console.log("filter", filter)
  const tableData = await LaunchPadCollection.find(filter)
    .sort({ [sort_by_name]: sort_by_order })
    .skip((page - 1) * limit)
    .limit(limit).select('-tokenURI');

  const row_count = await LaunchPadCollection.count(filter);

  const result = customPagination.customPagination(tableData, page, limit, row_count);

  return result;
};

const getFailedCollectionList = async (filter, options, req) => {
  let page = options.page;
  let limit = options.limit;
  let sort_by_name = options.sortBy ? options.sortBy.name : "";
  let sort_by_order = options.sortBy ? options.sortBy.order : "";

  //console.log("filter", filter)
  const tableData = await LaunchPadCollection.find(filter)
    .sort({ [sort_by_name]: sort_by_order })
    .skip((page - 1) * limit)
    .limit(limit).select('-tokenURI');

  const row_count = await LaunchPadCollection.count(filter);

  const result = customPagination.customPagination(tableData, page, limit, row_count);

  return result;
};

module.exports = {
  createCollectionService,
  getLaunchPadCollectionList,
  getLaunchPadLiveCollectionList,
  getLaunchPadEndCollectionList,
  getHideCollectionList,
  getFailedCollectionList
};
