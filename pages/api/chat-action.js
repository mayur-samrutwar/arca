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

    For checkBalance, if no address is specified, use the keyword "sender" as the address parameter.

    Return ONLY a JSON object with the following structure:
    {
      "function": "functionName",
      "params": {
        "address": "sender" or "0x...",
        "amount": "10" // only for transfer functions
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
    
    // Handle the "sender" keyword for checkBalance
    if (action.function === 'checkBalance' && action.params.address === 'sender') {
      action.params.address = agentAddress;
    }

    console.log('Executing action:', action);

    // Execute the appropriate function
    let result;
    switch (action.function) {
      case 'checkBalance':
        result = await personalActions.checkBalance(action.params.address);
        break;

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

      default:
        throw new Error('Unknown function');
    }

    // Format the response for checkBalance
    const response = {
      success: true,
      action: action.function,
      result: action.function === 'checkBalance' ? `${result} ARCA` : result
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}