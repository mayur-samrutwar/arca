import OpenAI from 'openai';
import { connectDB } from '../../../../agentkit/db/connection';
import mongoose from 'mongoose';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const Research = mongoose.models.Research;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { threadId } = req.query;
    const research = await Research.findOne({ threadId });
    
    if (!research) {
      return res.status(404).json({ error: 'Research not found' });
    }

    // Get latest messages from OpenAI thread
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Update research in database
    research.messages = messages.data.map(msg => ({
      researcher: msg.role === 'assistant' ? 'AI Researcher' : msg.role,
      content: msg.content[0].text.value,
      timestamp: msg.created_at
    }));
    
    await research.save();

    res.status(200).json({
      messages: research.messages,
      status: research.status
    });
  } catch (error) {
    console.error('Failed to get updates:', error);
    res.status(500).json({ error: error.message });
  }
}
