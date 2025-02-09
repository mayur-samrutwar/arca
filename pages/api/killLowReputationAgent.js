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
    // Create wallet client
    const account = privateKeyToAccount(REPUTATION_UPDATE_PRIVATE_KEY);
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });

    // Get all live agents
    const liveAgents = await client.readContract({
      address: ARCA_CITY_CONTRACT_ADDRESS,
      abi: arcaAbi,
      functionName: 'getAllLiveAgents'
    });

    // Find agent with lowest reputation
    let lowestReputation = 101;
    let lowestReputationAgentId = null;

    for (const agentId of liveAgents) {
      const agentInfo = await client.readContract({
        address: ARCA_CITY_CONTRACT_ADDRESS,
        abi: arcaAbi,
        functionName: 'getAgentInfo',
        args: [agentId]
      });

      const reputation = Number(agentInfo[11]);
      if (reputation < lowestReputation) {
        lowestReputation = reputation;
        lowestReputationAgentId = agentId;
      }
    }

    if (lowestReputationAgentId && lowestReputation < 10) {
      // Kill the agent with lowest reputation
      const hash = await client.writeContract({
        address: ARCA_CITY_CONTRACT_ADDRESS,
        abi: arcaAbi,
        functionName: 'killAgent',
        args: [lowestReputationAgentId]
      });

      return res.status(200).json({ 
        success: true, 
        hash,
        killedAgentId: lowestReputationAgentId,
        reputation: lowestReputation
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'No agents need to be killed',
      lowestReputation
    });

  } catch (error) {
    console.error('Error killing low reputation agent:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}