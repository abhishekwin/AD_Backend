const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const historySchema = new Schema({
    userId: { type:String, default:null},
    oldUserId: { type:String, default:null},
    nftId: { type:String, default:null},
    actionType: { type:Number, default:null}, //fixed =1, bid= 2, auction=3, end=4, cancel= 5
    price: { type:Number, default:null},
    paymentType: { type:String, default:"BNB"},
    time: { type:Date, default:new Date},
    epochTime :{ type:Number, default:null},
    cronType: { type:String, default:null},
    eventType: { type:String, default:null},
    subGraphId: { type:String, default:null}
}, { timestamps: true });

historySchema.virtual('userDetails', {
    ref: 'users',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
  });

  historySchema.virtual('nftDetails', {
    ref: 'nfts',
    localField: 'nftId',
    foreignField: '_id',
    justOne: true,
  });
  historySchema.set('toJSON', { getters: true, virtuals: true })
const History = mongoose.model('history', historySchema);
module.exports = History