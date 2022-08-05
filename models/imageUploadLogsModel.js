const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const imageUploadLogsSchema = new Schema({
    nftId: { type: String, default: null },
    tokenURI: { type: String, default: null },
    imageUrl: { type: String, default: null },
    error: { type: String, default: null },
}, { timestamps: true });

const ImageUploadLogs = mongoose.model('imageuploadlogs', imageUploadLogsSchema);
module.exports = ImageUploadLogs