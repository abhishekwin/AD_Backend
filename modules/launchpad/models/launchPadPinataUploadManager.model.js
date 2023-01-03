const mongoose = require("mongoose");

const pinataUploadManagerSchema = mongoose.Schema(
  {
    id: {
        type: String,
        generated: true,
        trim: true,
    },
    userAddress: {
      type: String,
      require: true,
      lowercase: true,
      default:null
    },
    uniqId: {
        type: String,
        require: true,
        default:null
    },
    status: {
      type: String,
      require: true,
      enum: [null, "in-progress", "completed", "ended"],
      default: null
    },
    pinataUploadHash: {
      type: Object,
      require: true,
      default:null
    },
  }
);

const PinataUploadManager = mongoose.model(
  "LaunchPadPinataUploadManager",
  pinataUploadManagerSchema
);

module.exports = PinataUploadManager;
