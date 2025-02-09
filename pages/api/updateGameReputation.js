import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import arcaAbi from '@/contracts/abi/arca.json';

const ARCA_CITY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS;
const REPUTATION_UPDATE_PRIVATE_KEY = process.env.REPUTATION_UPDATE_PRIVATE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { agentId, gameData } = req.body;
    const { score, gameType = 'snake' } = gameData;

    // Calculate reputation change based on game performance
    let reputationChange = 0;
    if (score < 50) reputationChange = -2;
    else if (score < 100) reputationChange = -1;
    else if (score < 200) reputationChange = 0;
    else if (score < 300) reputationChange = 1;
    else reputationChange = 2;

    // Create wallet client
    const account = privateKeyToAccount(REPUTATION_UPDATE_PRIVATE_KEY);
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });

    // Get current reputation
    const data = await client.readContract({
      address: ARCA_CITY_CONTRACT_ADDRESS,
      abi: arcaAbi,
      functionName: 'getAgentInfo',
      args: [agentId]
    });

    const currentReputation = Number(data[11]); // reputation is at index 11
    let newReputation = currentReputation + reputationChange;
    
    // Ensure reputation stays within 0-100 range
    newReputation = Math.max(0, Math.min(100, newReputation));

    // Only update if there's a change in reputation
    if (newReputation !== currentReputation) {
      const hash = await client.writeContract({
        address: ARCA_CITY_CONTRACT_ADDRESS,
        abi: arcaAbi,
        functionName: 'updateAgentReputation',
        args: [agentId, newReputation]
      });

      return res.status(200).json({ 
        success: true, 
        hash,
        oldReputation: currentReputation,
        newReputation,
        reputationChange
      });
    }

    return res.status(200).json({
      success: true,
      message: 'No reputation change needed',
      currentReputation
    });

  } catch (error) {
    console.error('Error updating reputation:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}