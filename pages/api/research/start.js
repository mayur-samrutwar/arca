import OpenAI from 'openai';
import { connectResearchDB } from '@/utils/db/db';
import mongoose from 'mongoose';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define Research Schema
const ResearchSchema = new mongoose.Schema({
  threadId: String,
  researchers: [{
    name: String,
    occupation: String,
    traits: [String]
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
  finalPaper: {
    title: String,
    content: String,
    conclusions: [String],
    timestamp: Date
  },
  currentSpeaker: String
});

const Research = mongoose.models.Research || mongoose.model('Research', ResearchSchema);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectResearchDB();

    const { researchers } = req.body;

    // Create OpenAI thread
    const thread = await openai.beta.threads.create();

    // Initialize research in database
    const research = await Research.create({
      threadId: thread.id,
      researchers,
      messages: [],
      status: 'active',
      currentSpeaker: researchers[0].name
    });

    // Start the research discussion
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `You are moderating a research discussion between ${researchers.map(r => r.name).join(', ')} on Autosomal Recessive Cerebreller Ataxia, focusing on technology and innovation. Please introduce the topic and ask the first researcher to share their thoughts.`
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID
    });

    res.status(200).json({ threadId: thread.id });
  } catch (error) {
    console.error('Research start failed:', error);
    res.status(500).json({ error: error.message });
  }
}