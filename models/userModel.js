const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const userSchema = new Schema({
  avatar: { type: String, deafult: "assets/img/avatars/avatar.jpg" },
  usertype: { type: String, deafult: null }, // user, admin
  imageCover: { type: String, default : null }, 
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  nickName: { type: String, default: null },
  account : { type: String, default: null, lowercase: true }, //wallet_address
  bio: { type: String, default: null },
  twitter: { type: String, default: null },
  telegram: {type: String, default: null },
  instagram: {type: String, default : null },
  subscribe: { type: String, default: null },
  isBlackList: { type: Boolean, default: false },
  followers: [],
  nonce: { type: String, deafult: null }
}, { 
  //timestamps: true 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

userSchema.index({ "$**" : "text" })
userSchema.virtual('follower_count', {
  ref: 'userfollower',
  localField: '_id',
  foreignField: 'user_id',
  count: true,
});

userSchema.virtual('is_followed', {
  ref: 'userfollower',
  localField: '_id',
  foreignField: 'user_id',
  count: true,
});

userSchema.set('toJSON', { getters: true, virtuals: true })
const Users = mongoose.model('users', userSchema);
module.exports = Users
