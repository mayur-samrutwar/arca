import { personalActions } from '../personal';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import arcaAbi from '../../contracts/abi/arca.json';

const ARCA_CITY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS;

export const agentTaxManager = {
  // Store active agent timers
  activeTimers: new Map(),

  // Start tax collection for a new agent
  startTaxCollection: async (agentId, privateKey) => {
    if (agentTaxManager.activeTimers.has(agentId)) {
      return; // Already collecting tax for this agent
    }

    const timer = setInterval(async () => {
      try {
        // Check if agent is still alive
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http()
        });

        const agentInfo = await publicClient.readContract({
          address: ARCA_CITY_CONTRACT_ADDRESS,
          abi: arcaAbi,
          functionName: 'getAgentInfo',
          args: [BigInt(agentId)]
        });

        // agentInfo.result[8] is isAlive based on contract structure
        if (!agentInfo[8]) {
          agentTaxManager.stopTaxCollection(agentId);
          return;
        }

        // Transfer 1 ARCA to city contract
        await personalActions.transfer(
          privateKey,
          ARCA_CITY_CONTRACT_ADDRESS,
          "1" // 1 ARCA
        );

        console.log(`Tax collected from agent ${agentId}`);

      } catch (error) {
        console.error(`Failed to collect tax from agent ${agentId}:`, error);
        // If agent can't pay, we might want to kill them or implement some penalty
      }
    }, 60000); // Run every minute

    agentTaxManager.activeTimers.set(agentId, timer);
  },

  // Stop tax collection for an agent
  stopTaxCollection: (agentId) => {
    const timer = agentTaxManager.activeTimers.get(agentId);
    if (timer) {
      clearInterval(timer);
      agentTaxManager.activeTimers.delete(agentId);
    }
  },

  // Clean up all timers
  cleanup: () => {
    for (const [agentId, timer] of agentTaxManager.activeTimers) {
      clearInterval(timer);
    }
    agentTaxManager.activeTimers.clear();
  }
};