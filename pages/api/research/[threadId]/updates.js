import OpenAI from 'openai';
import { connectResearchDB } from '@/utils/db/db';
import mongoose from 'mongoose';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define Research Schema if not already defined elsewhere
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
  currentSpeaker: String
});

const Research = mongoose.models.Research || mongoose.model('Research', ResearchSchema);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectResearchDB();
    
    const { threadId } = req.query;
    const research = await Research.findOne({ threadId });
    
    if (!research) {
      return res.status(404).json({ error: 'Research not found' });
    }

    // Get latest messages and run status
    const messages = await openai.beta.threads.messages.list(threadId);
    const runs = await openai.beta.threads.runs.list(threadId);
    const latestRun = runs.data[0];
    
    // Only process new messages if the last run is complete
    if (latestRun?.status === 'completed') {
      // Update research in database with safer content extraction
      const newMessages = messages.data.map(msg => {
        let content = '';
        if (msg.content && Array.isArray(msg.content)) {
          const textContent = msg.content.find(c => c.type === 'text');
          content = textContent?.text?.value || 'No content available';
        }
        return {
          researcher: msg.role === 'assistant' ? research.currentSpeaker : 'System',
          content: content,
          timestamp: msg.created_at
        };
      });

      // Only add new messages
      if (newMessages.length > research.messages.length) {
        research.messages = newMessages;
        
        // Count responses per researcher
        const responseCount = {};
        research.messages.forEach(msg => {
          if (msg.researcher !== 'Moderator' && msg.researcher !== 'System') {
            responseCount[msg.researcher] = (responseCount[msg.researcher] || 0) + 1;
          }
        });

        // Check if discussion should end
        const maxResponses = 3;
        const reachedLimit = Object.values(responseCount).some(count => count >= maxResponses);
        
        if (reachedLimit) {
          research.status = 'completed';
          research.currentSpeaker = 'Moderator';
        } else {
          // Get next researcher
          const currentIndex = research.researchers.findIndex(r => r.name === research.currentSpeaker);
          const nextIndex = (currentIndex + 1) % research.researchers.length;
          const nextResearcher = research.researchers[nextIndex].name;
          
          research.currentSpeaker = nextResearcher;
          
          // Create next prompt
          await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: `As ${nextResearcher}, respond briefly to the previous point (2-3 sentences).`
          });
          
          await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.OPENAI_ASSISTANT_ID
          });
        }
        
        await research.save();
      }
    }

    res.status(200).json({
      messages: research.messages,
      status: research.status
    });
  } catch (error) {
    console.error('Failed to get updates:', error);
    res.status(500).json({ error: error.message });
  }
}