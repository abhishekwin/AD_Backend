

module.exports = {
  ...require("./collection.controller"),
  ...require("./whiteLisedUser.controller"),
  ...require("./fileUpload.controller"),
  ...require("./nft.controller"),
  ...require("./admin.controller"),
  ...require("./currency.controller.js")
};
