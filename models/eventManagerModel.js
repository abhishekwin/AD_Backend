const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const eventSchema = new Schema({
    name: {
        type: String,
        trim: true,
        default: null,
    },
    lastcrontime: {
        type: String,
        trim: true,
        default: null,
    },
    blockNumber: {
        type: Number, 
        trim: true,
        default: 0
    }
}, { timestamps: true });

eventSchema.index({ "$**" : "text" })
const EventManager = mongoose.model('eventmanager', eventSchema);
module.exports = EventManager