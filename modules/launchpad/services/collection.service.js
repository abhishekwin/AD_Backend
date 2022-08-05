const httpStatus = require('http-status');
const { Collection } = require('../models');

// const CustomPaginationHelper = require('../../../Helpers/CustomPagination');

/**
 * Create a sportlight post
 * @param {Object} cityBody
 * @returns {Promise<User>}
 */
const createCollectionService = async (reqBody) => {
  const createpost = await Collection.create(reqBody);
  return createpost;
};

module.exports = {
  createCollectionService
};
