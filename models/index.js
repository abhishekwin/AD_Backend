const CollectionNFTs = require('./collectionNFTsModel');
const Users = require('./userModel');
const Nfts = require('./nftsModel');
const History = require('./historyModel');
const Nonce = require('./nonceModel');
const EventManager = require('./eventManagerModel');
const Bid = require('./bidModel');
const CronManagerModel = require('./cronManagerModel');
const UserFollower = require('./userFollowerModel');
const ImageUploadLogs = require('./imageUploadLogsModel');



module.exports = {
    CollectionNFTs,
    Users,
    Nfts,
    History,
    Nonce,
    EventManager,
    Bid,
    CronManagerModel,
    UserFollower,
    ImageUploadLogs,
  
}