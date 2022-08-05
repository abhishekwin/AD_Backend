exports.getQueryString = (queryString) => {
  return queryString = queryString.replace(
    /\b(gte|gt|lte|lt)\b/g,
    (match) => `$${match}`
  );
};
