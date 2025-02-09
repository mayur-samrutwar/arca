const mongoose = require('mongoose');

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
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Agent', AgentSchema);