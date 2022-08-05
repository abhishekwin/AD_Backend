const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const bidSchema = new Schema({
    userId: { type:String, default:null},
    nftId: { type:String, default:null},
    value: { type:String, default:null},
    strtimestamps: { type:String, default:null}
}, { timestamps: true });

const Bid = mongoose.model('bid', bidSchema);
module.exports = Bid