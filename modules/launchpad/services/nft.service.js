const { LaunchPadNft } = require('../models');
const customPagination = require('../../comman/customPagination');


const getLaunchPadNftList = async (filter, options, req) => {

    let page = options.page;
    let limit = options.limit;
    let sort_by_name = options.sortBy?options.sortBy.name:"";
    let sort_by_order = options.sortBy?options.sortBy.order:"";
  
    // console.log("filtercolumn", filter);
  
    const tableData = await LaunchPadNft.find(filter)
      .sort({ [sort_by_name]: sort_by_order })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-tokenURI');
  
    const row_count = await LaunchPadNft.count(filter);
  
    const result = customPagination.customPagination(tableData, page, limit, row_count);
  
    return result;
  };

 module.exports ={
    getLaunchPadNftList
 } 