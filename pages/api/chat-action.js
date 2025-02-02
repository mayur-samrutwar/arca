import OpenAI from 'openai';
import { personalActions } from '@/utils/personal';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, privateKey } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Update the system prompt to be more explicit about private key handling
    const systemPrompt = `You are a helper that interprets user messages to determine which function to call.
    Available functions are:
    - transfer(privateKey, recipientAddress, amount)
    - donate(privateKey, organizationAddress, amount)
    - payRent(privateKey, landlordAddress, amount)
    - sendGift(privateKey, recipientAddress, amount)
    - checkBalance(address)

    For any transaction function, extract the private key from the user's message if provided.
    Return ONLY a JSON object with the following structure:
    {
      "function": "functionName",
      "params": {
        "privateKey": "0x...",  // Include if provided in message
        "recipientAddress": "0x...",
        "amount": "10"
      }
    }`;

    // First, use OpenAI to interpret the user's message
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const action = JSON.parse(completion.choices[0].message.content);

    console.log(action);

    // Execute the appropriate function based on OpenAI's interpretation
    let result;
    switch (action.function) {
      case 'transfer':
        result = await personalActions.transfer(
          action.params.privateKey,
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