const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const collectionNFTsSchema = new Schema({
  collectionAddress: {type: String, default: null, lowercase: true},
  imageCover: { type: String, default: null},
  name : { type: String, default: null},
  symbolNFT: { type: String, default: null},
  maxSupply: { type: Number, default: 0},
  startRange: {type: Number, default: null},
  endRange: {type: Number, default: 0},
  baseURI: {type: String, default: null},
  placeHolderURI: {type: String, default: null},
  tknURI: {type: String, default: null},
  isSale: {type: Boolean, default: false},
  ownerAvatar: {type: String, default: null},
  owner: {type: String, default: null, lowercase: true},
  creator: {type: String, default: null, lowercase: true},
  description:{type: String, default: null},
  time: {type: Number, default: 0},
  saleType: {type: String, default: null},
  totoalNFTs: {type: Number, default: 0},
  likes: [],
  created:  Date,
  approve: { type: Boolean , default: false},
  type: {type: String, default: "image"},
  image: {type: String, default: null},
  bannerImages: { type: String, default: null},
  isMoralisesCollection:{ type: Boolean, default: false },
  isMoralisesDataStatus:{ type: String, default: null },//pending, in-progress, failed, completed
  moralisesNftSuccessAndFail:{ type: Object, default: null }//total, success , fail
}, { timestamps: true });

collectionNFTsSchema.index({ "$**" : "text" })
const CollectionNFTs = mongoose.model('collectionNFTs', collectionNFTsSchema);
module.exports = CollectionNFTs
