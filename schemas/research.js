import mongoose from 'mongoose';

const ResearchSchema = new mongoose.Schema({
  researchers: [{
    name: String,
    occupation: String,
  }],
  messages: [{
    researcher: String,
    content: String,
    timestamp: Date
  }],
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  paper: {
    title: String,
    abstract: String,
    findings: [String],
    conclusions: [String],
    timestamp: Date
  }
});

export const Research = mongoose.models.Research || mongoose.model('Research', ResearchSchema);