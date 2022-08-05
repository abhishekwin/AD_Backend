const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const userFollowerSchema = new Schema({
    user_id: {
        type: String,
        trim: true,
        default: null,
    },
    follower_id: {  
        type: String,
        trim: true,
        default: null,
    }
}, { timestamps: true });

const UserFollower = mongoose.model('userfollower', userFollowerSchema);
module.exports = UserFollower