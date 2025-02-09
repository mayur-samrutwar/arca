import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agent1, agent2 } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are generating a natural conversation between two people meeting on the street.
            Return ONLY a JSON object with a 'messages' array containing exactly 10 message objects.
            Each message object should have:
            - 'speaker': the name of who's speaking
            - 'message': what they say (keep it brief and natural)
            - 'action': a physical action they do (like "waves", "smiles", "points", etc.)
            
            The conversation should flow naturally and end with them saying goodbye and walking away.`
        },
        {
          role: "user",
          content: `Create a conversation between ${agent1.seed} and ${agent2.seed} meeting on the street.
            Make it natural with greetings, small talk, and a proper goodbye.
            Include simple physical actions they do while talking.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const conversation = JSON.parse(response.choices[0].message.content);
    
    // Validate the response format
    if (!conversation.messages || !Array.isArray(conversation.messages)) {
      throw new Error('Invalid response format');
    }

    res.status(200).json(conversation);

  } catch (error) {
    console.error('Failed to generate conversation:', error);
    // Fallback conversation with proper structure
    res.status(200).json({ 
      messages: [
        { speaker: agent1.seed, message: "Oh, hi there!", action: "waves" },
        { speaker: agent2.seed, message: "Hey! Nice day for a walk.", action: "smiles" },
        { speaker: agent1.seed, message: "It really is! How are you?", action: "gestures at the sky" },
        { speaker: agent2.seed, message: "I'm great, just heading to the market.", action: "adjusts bag" },
        { speaker: agent1.seed, message: "The one on Main Street?", action: "points down the road" },
        { speaker: agent2.seed, message: "Yeah, they have great produce there!", action: "nods enthusiastically" },
        { speaker: agent1.seed, message: "I should check it out sometime.", action: "looks interested" },
        { speaker: agent2.seed, message: "You definitely should! Well, I better get going.", action: "checks time" },
        { speaker: agent1.seed, message: "Nice meeting you! Take care!", action: "waves goodbye" },
        { speaker: agent2.seed, message: "You too! Bye!", action: "starts walking away" }
      ]
    });
  }
}