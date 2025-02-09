import { Research } from '@/schemas/research';
import { connectResearchDB } from '@/utils/db/db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectResearchDB();
    const { researchers } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{
        role: "system",
        content: `Generate a research discussion between ${researchers.length} researchers (${researchers.map(r => r.name).join(', ')}) 
          on potential cures for Autosomal Recessive Cerebellar Ataxia. 
          
          Return the response as a JSON object with the following structure:
          {
            "messages": [
              {
                "researcher": "string",
                "content": "string"
              }
            ],
            "paper": {
              "title": "string (provide a clear scientific title)",
              "abstract": "string (provide a comprehensive abstract summarizing the discussion)",
              "findings": ["string (list at least 3-5 key findings)"],
              "conclusions": ["string (list 2-3 main conclusions)"]
            }
          }

          Ensure all paper fields (title, abstract, findings, and conclusions) are properly populated with relevant content from the discussion.
          The discussion should be creative and scientifically grounded, focusing on novel treatment approaches.
          The paper should thoroughly summarize the key findings and conclusions from the discussion.`
      }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    // Save to database with proper structure and timestamp
    const research = await Research.create({
      researchers,
      messages: result.messages.map(msg => ({
        ...msg,
        timestamp: new Date()
      })),
      paper: {
        ...result.paper,
        timestamp: new Date()
      },  // Save complete paper data with timestamp
      status: 'completed'
    });

    // Return both discussion and paper with ID
    res.status(200).json({
      discussion: result.messages,
      paper: {
        ...result.paper,
        _id: research._id,
      }
    });
  } catch (error) {
    console.error('Research generation failed:', error);
    res.status(500).json({ error: error.message });
  }
}