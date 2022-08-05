const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const nonceSchema = new Schema({
    nonce: { type: Number, default: 0 },
}, { timestamps: true });

const Nonce = mongoose.model('nonce', nonceSchema);
module.exports = Nonce