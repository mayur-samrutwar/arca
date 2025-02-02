import OpenAI from 'openai';
import { personalActions } from '@/utils/personal';
import { parseEther } from 'viem';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ARCA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_ARCA_TOKEN_ADDRESS;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, privateKey, agentAddress } = req.body;

  if (!message || !privateKey || !agentAddress) {
    return res.status(400).json({ error: 'Message, private key, and agent address are required' });
  }

  try {
    const systemPrompt = `You are a helper that interprets user messages to determine which function to call.
    Available functions are:
    - transfer(recipientAddress, amount)
    - donate(organizationAddress, amount)
    - payRent(landlordAddress, amount)
    - sendGift(recipientAddress, amount)
    - checkBalance(address)

    Return ONLY a JSON object with the following structure:
    {
      "function": "functionName",
      "params": {
        "recipientAddress": "0x...",
        "amount": "10"
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
    
    // Validate amount if it exists
    if (action.params.amount) {
      if (isNaN(action.params.amount)) {
        throw new Error('Invalid amount specified');
      }
      // Convert string amount to string representation of wei
      action.params.amount = action.params.amount.toString();
    }

    console.log('Executing action:', action);

    // Execute the appropriate function
    let result;
    switch (action.function) {
      case 'transfer':
        result = await personalActions.transfer(
          privateKey,
          action.params.recipientAddress,
          action.params.amount
        );
        break;

      case 'donate':
        result = await personalActions.donate(
          privateKey,
          action.params.organizationAddress,
          action.params.amount
        );
        break;

      case 'payRent':
        result = await personalActions.payRent(
          privateKey,
          action.params.landlordAddress,
          action.params.amount
        );
        break;

      case 'sendGift':
        result = await personalActions.sendGift(
          privateKey,
          action.params.recipientAddress,
          action.params.amount
        );
        break;

      case 'checkBalance':
        result = await personalActions.checkBalance(
          action.params.address
        );
        break;

      default:
        throw new Error('Unknown function');
    }

    res.status(200).json({
      success: true,
      action: action.function,
      result
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}