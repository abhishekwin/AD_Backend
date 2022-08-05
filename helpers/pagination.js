
const customPagination = (data, page, limit, total_records) => {
    const paginat_data = {
      data: data,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total_records / limit),
      totalResults: total_records
    }
    return paginat_data;
  };
  
  module.exports = {
    customPagination,
  }
  