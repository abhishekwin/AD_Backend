const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const nftsSchema = new Schema({
  isFirstSale: {type:Boolean, default:false},
  collectionAddress: {
    type: String,
    default: null,
    trim: true,
    lowercase: true
  }, //contact address
  tokenId: {type: String, default:null}, //token id yes
  tokenURI: {type: String, default:null}, //token uri
  ownerAvatar: {type:String, default:null},
  owner: {type:String, default:null, lowercase: true}, // to from response
  creator: {type: String, default:null, lowercase: true}, // to from responsecreateor from response
  price: {type:Number, default:0},
  paymentType: {type:String, default:"BNB"},
  isSale: {type:Boolean, default:false},
  saleType: {type:String, default:"Fixed"},
  auctionStartTime: {type:Number, default:0}, //new
  auctionLength: {type:Number, default:0},
  auctionCreator: {type:String, default:null},
  auctionDuration: {type:Number, default:null}, //new
  auctionInfo: {type:String, default:null}, //new
  time: {type:String, default:null}, // tomestamp form response
  likes: [],
  attributes: [],
  created: Date, 
  type: {type: String, default: "image"}, // type form response
  edition: {type: Number , default: 0},
  category : {type: String, default: null}, // form response
  name:  String, // form response
  description: String, // form response
  royalties: Number, // form response
  isActive: { type: Boolean, default: true },
  signature: { type: String, default: null },
  nonce: { type: Number, default: 0 },
  image: { type: String, default: null},
  awsImage: { type: Object, default: null},
  compiler: { type: String, default: null },
  crontype:{ type: String, default: null },
  isCustodyByClaimed:{ type: Boolean, default: false },
  isMoralisesNft:{ type: Boolean, default: false },
  awsImagesUpdated:{ type: Boolean, default: false },
  awsImagesTryCount:{ type: Number, default: 0 },
}, { timestamps: true });

nftsSchema.virtual('bidDetails', {
  ref: 'bid',
  localField: '_id',
  foreignField: 'nftId',
  justOne: false,
});

nftsSchema.virtual('historyDetails', {
  ref: 'history',
  localField: '_id',
  foreignField: 'nftId',
  justOne: false,
});

nftsSchema.index({ "$**" : "text" })
nftsSchema.set('toJSON', { getters: true, virtuals: true })
const Nfts = mongoose.model('nfts', nftsSchema);
module.exports = Nfts