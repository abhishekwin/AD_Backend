const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const cronManagerSchema = new Schema({
    name: {
        type: String,
        trim: true,
        default: null,
    },
    start: {
        type: String,
        trim: true,
        default: null,
    },
    till: {
        type: String,
        trim: true,
        default: null,
    },
    is_running: {
        type: Number,
        trim: true,
        default: 0,
    },
}, { timestamps: true });


const CronManager = mongoose.model('cronmanager', cronManagerSchema);
module.exports = CronManager