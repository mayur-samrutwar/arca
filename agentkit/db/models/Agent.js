const mongoose = require('mongoose');

const CdpWalletDataSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true
  },
  seed: {
    type: String,
    required: true
  },
  networkId: {
    type: String,
    required: true
  }
}, { _id: false });

const AgentSchema = new mongoose.Schema({
  ownerAddress: {
    type: String,
    required: true,
    index: true
  },
  agentAddress: {
    type: String,
    required: true,
    unique: true
  },
  cdpWalletData: {
    type: CdpWalletDataSchema,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Agent', AgentSchema);