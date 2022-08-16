const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { number } = require('@hapi/joi');

const nftSchema = mongoose.Schema(
  {
    id: {
      type: String,
      generated: true,
      trim: true,
    },
    nftName: {
      type: String,
      trim: true,
      default: null,
    },
    nftDescription: {
      type: String,
      trim: true,
      default: null,
    },
    mintCost: {
        type: Number,
        trim: true,
        default: null,
    },
    royalties: {
        type: Number,
        trim: true,
        default: null,
    },
    status: {
        type: String,
        trim: true,
        default: null, //active
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// add plugin that converts mongoose to json
nftSchema.set('toJSON', { getters: true, virtuals: true })
nftSchema.plugin(toJSON);
nftSchema.plugin(paginate);

/**
 * @typedef LaunchPadNft
 */
const LaunchPadNft = mongoose.model('LaunchPadNft', nftSchema);

module.exports = LaunchPadNft;
