import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, agentAddress, ownerAddress } = req.body;

  if (!message || !agentAddress || !ownerAddress) {
    return res.status(400).json({ error: 'Message, agent address, and owner address are required' });
  }

  try {
    const systemPrompt = `You are a helper that interprets user messages to determine which function to call.
    Available functions are:
    - transfer(recipientAddress, amount)
    - checkBalance(address)
    - getWalletAddress()

    For checkBalance, if no address is specified or if the user asks about "my balance", use the keyword "sender" as the address parameter.

    When users ask about their wallet address or say "What is your wallet address?", use the getWalletAddress action.

    Return ONLY a JSON object with the following structure:
    {
      "action": "actionName",
      "params": {
        "address": "sender" or "0x...",
        "amount": "10",
        "recipientAddress": "0x..."
      }
    }

    Example responses:
    For "What's my balance?":
    {
      "action": "checkBalance",
      "params": {
        "address": "sender"
      }
    }

    For "What is your wallet address?":
    {
      "action": "getWalletAddress",
      "params": {}
    }

    For "Transfer 10 ARCA to 0x123...":
    {
      "action": "transfer",
      "params": {
        "amount": "10",
        "recipientAddress": "0x123..."
      }
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const action = JSON.parse(completion.choices[0].message.content);
    
    // Call agent-action endpoint
    const actionResponse = await fetch('http://localhost:3001/agent-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentAddress,
        ownerAddress,
        action: action.action,
        params: action.params
      })
    });

    const actionData = await actionResponse.json();
    
    if (!actionResponse.ok) {
      throw new Error(actionData.error || 'Action failed');
    }

    res.json(actionData);
  } catch (error) {
    console.error('Chat action failed:', error);
    res.status(500).json({ error: error.message });
  }
}