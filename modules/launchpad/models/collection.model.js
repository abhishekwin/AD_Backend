const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const { number } = require("@hapi/joi");


const collectionSchema = mongoose.Schema(
  {
    id: {
      type: String,
      generated: true,
      trim: true,
    },
    collectionAddress: {
      type: String,
      trim: true,
      default: null,
      lowercase: true
    },
    contractName: {
      type: String,
      trim: true,
      default: null,
    },
    collectionName: {
      type: String,
      trim: true,
      default: null,
    },
    symbol: {
      type: String,
      trim: true,
      default: null,
    },
    launchCollectionLater: {
      type: Boolean,
      trim: true,
      default: null,
    },
    // addWhitelist: {
    //   type: Boolean,
    //   trim: true,
    //   default: null,
    // },
    // baseArtName: {
    //   type: String,
    //   trim: true,
    //   default: null,
    // },
    nftDescription: {
      type: String,
      trim: true,
      default: null,
    },
    creator: {
      type: String,
      trim: true,
      default: null,
      lowercase: true
    },
    owner: {
      type: String,
      trim: true,
      default: null,
      lowercase: true
    },
    mintCost: {
      type: Number,
      trim: true,
      default: 0,
    },
    mintCountPerUser:{
      type: Number,
      trim: true,
      default: 0,
    },
    mintCountPerTransaction:{
      type: Number,
      trim: true,
      default: 0,
    },
    royalties: {
      type: Number,
      trim: true,
      default: 0,
    },
    tokenURI: {
      type: String,
      trim: true,
      default: null,
    },
    s3URI: {
      type: String,
      trim: true,
      default: null,
    },
    s3URIStatus: {
      type: String,
      enum: [null, "in-progress", "ready-to-syncup", "syncing", "completed"],
      trim: true,
      default: null,
    },
    imageCover: {
      type: String,
      trim: true,
      default: null,
    },
    bannerImages: {
      type: String,
      trim: true,
      default: null,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    maxSupply: {
      type: Number,
      default: 0,
    },
    whitelistedFee: {
      type: Number,
      default: 0,
    },
    maximumQuantity: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    contactUri: {
      type: String,
      trim: true,
      default: null,
    },
    currency: {
      type: String,
      enum: ["ETH", "BNB", "SAFEMOON", "DOGE", "USDC", "AD"],
      default: "BNB",
    },
    currencyDetails: {
      type: Array,
      default: null,
    },
    currencyDetailsForWhiteListed: {
      type: Array,
      default: null,
    },
    currencyAddress: {
      type: String,
      trim: true,
      default: null,
    },
    isWhiteListedUser: {
      type: Boolean,
      default: false,
    },
    isSale: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [null, "in-progress", "ready-to-syncup", "syncing", "completed", "ended"],
      default: null,
    },
    nonce:{
      type: Number,
      default: 0
    },
    networkId: {
      type: Number,
      default: 0,
    },
    networkName: {
      type: String,
      trim: true,
      default: null,
    },
    nftMintCount: {
      type: Number,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    hideByAdmin: {
      type: String,
      default: null,
    },
    unHideByAdmin: {
      type: String,
      default: null,
    },
    failedNfts:{
      type: Array,
      default: null,
    },
    failedNftsCheckCount:{
      type: Number,
      default: 0,
    },
    isReveal:{
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// collectionSchema.pre("save", async function (next) {
//   const collection = this;
//   if (collection.isModified("tokenURI")) {
//     collection.tokenURI =
//       "https://bleufi.mypinata.cloud/ipfs/" + collection.tokenURI;
//   }
//   next();
// });

collectionSchema.virtual('isWhiteListed', {
  ref: 'WhiteListedUser',
  localField: '_id',
  foreignField: 'collectionId',
  count: true
});
collectionSchema.virtual('whiteListedUsers', {
  ref: 'WhiteListedUser',
  localField: '_id',
  foreignField: 'collectionId',
  justOne: false
});

collectionSchema.virtual('userMintCount', {
  ref: 'LaunchPadMintHistory',
  localField: 'collectionAddress',
  foreignField: 'collectionAddress',
  count: true
});

collectionSchema.virtual('nfts', {
  ref: 'LaunchPadNft',
  localField: '_id',
  foreignField: 'collectionId',
  justOne: false
});

collectionSchema.virtual('nftCount', {
  ref: 'LaunchPadNft',
  localField: '_id',
  foreignField: 'collectionId',
  count: true
});

collectionSchema.virtual('phases', {
  ref: 'LaunchPadCollectionPhase',
  localField: '_id',
  foreignField: 'collectionId',
  justOne: false
});


// collectionSchema.pre('find', function() {
//     this.where({ deletedAt: null });
// });

// collectionSchema.pre('findOne', function() {
//   this.where({ deletedAt: null });
// });

collectionSchema.virtual('whiteListedUsersInArray').get(function () {
  let whiteListedUsers = []
  if(this.whiteListedUsers){
    for (const iterator of this.whiteListedUsers) {
      whiteListedUsers.push(iterator.userAddress)
    }
  }  
  return whiteListedUsers;
});


// add plugin that converts mongoose to json
collectionSchema.set("toJSON", { getters: true, virtuals: true });
collectionSchema.plugin(toJSON);
collectionSchema.plugin(paginate);

/**
 * @typedef Collection
 */
const Collection = mongoose.model("LaunchPadCollection", collectionSchema);

module.exports = Collection;
