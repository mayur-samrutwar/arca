import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if API key exists
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    return res.status(500).json({ 
      error: 'Configuration Error',
      message: 'OpenAI API key is not set in environment variables'
    });
  }

  try {
    // Initialize OpenAI with debug logging
    console.log('Initializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test API connection first
    console.log('Testing OpenAI connection...');
    try {
      await openai.models.list();
    } catch (apiError) {
      console.error('OpenAI API connection test failed:', apiError);
      return res.status(500).json({
        error: 'API Connection Error',
        message: 'Failed to connect to OpenAI API',
        details: apiError.message
      });
    }

    console.log('Creating assistant...');
    const assistant = await openai.beta.assistants.create({
      name: "Research Discussion Assistant",
      instructions: `You are moderating a research discussion between multiple researchers on medical topics.
        Follow these rules:
        1. Keep responses focused and concise
        2. Maintain context between messages
        3. Alternate between researchers
        4. Ask specific questions to each researcher
        5. Reference previous points made in the discussion
        6. Don't repeat the same context or introduction
        7. Each response should be from one researcher only
        8. Track which researcher spoke last and ensure the next response comes from a different researcher`,
      model: "gpt-4-turbo-preview"
    });

    console.log('Assistant created successfully:', assistant.id);
    return res.status(200).json({ 
      success: true,
      assistantId: assistant.id,
      created_at: assistant.created_at 
    });

  } catch (error) {
    console.error('Error creating assistant:', error);
    return res.status(500).json({
      error: 'Assistant Creation Error',
      message: error.message,
      details: error.response?.data || error.stack
    });
  }
}