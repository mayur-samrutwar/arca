import { useState, useEffect } from 'react';
import { useReadContracts, useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import arcaAbi from '../contracts/abi/arca.json';

const ARCA_CITY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS;

export default function MyAgents() {
  const [agentDetails, setAgentDetails] = useState([]);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  // Get agent IDs
  const { data: myAgentIds, isError, isLoading: isLoadingIds } = useReadContract({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getMyAgents',
    account: address,
    watch: true,
  });

  // Prepare contracts config for batch reading all agents
  const agentInfoConfig = myAgentIds?.map(id => ({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getAgentInfo',
    args: [id],
  })) ?? [];

  // Fetch all agents info in parallel
  const { data: agentsInfo, isLoading: isLoadingInfo } = useReadContracts({
    contracts: agentInfoConfig,
    enabled: Boolean(myAgentIds?.length),
  });

  // Format agent info when available
  useEffect(() => {
    if (!agentsInfo || !myAgentIds) return;

    const formattedAgents = agentsInfo.map((info, index) => ({
      id: myAgentIds[index],
      name: info.result[0],
      owner: info.result[1],
      gender: info.result[2],
      occupation: info.result[3],
      initialBalance: formatEther(info.result[4]),
      traits: info.result[5],
      birthDate: new Date(Number(info.result[6]) * 1000),
      expiryDate: new Date(Number(info.result[7]) * 1000),
      isAlive: info.result[8],
      rewardBalance: formatEther(info.result[9]),
      publicKey: info.result[10],
      privateKey: info.result[11],
    }));

    setAgentDetails(formattedAgents);
  }, [agentsInfo, myAgentIds]);

  // Add handleKillAgent function
  const handleKillAgent = async (agentId) => {
    try {
      await writeContract({
        address: ARCA_CITY_CONTRACT_ADDRESS,
        abi: arcaAbi,
        functionName: 'killAgent',
        args: [agentId]
      });
    } catch (error) {
      console.error('Failed to kill agent:', error);
    }
  };

  // Add handleClaimReward function
  const handleClaimReward = async (agentId) => {
    try {
      await writeContract({
        address: ARCA_CITY_CONTRACT_ADDRESS,
        abi: arcaAbi,
        functionName: 'claimReward',
        args: [agentId]
      });
    } catch (error) {
      console.error('Failed to claim rewards:', error);
    }
  };

  // Show loading state
  if (isLoadingIds || isLoadingInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading agents...</div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500 text-center">Error loading agents</div>
      </div>
    );
  }

  // Show no wallet connected state
  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Please connect your wallet to view your agents</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Agents</h1>
        <div className="text-sm text-gray-500">
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      </div>

      <div className="grid gap-4">
        {agentDetails.map((agent) => (
          <div
            key={agent.id}
            className="p-4 rounded-lg border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{agent.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    agent.isAlive ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-foreground/70">
                    {agent.isAlive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-foreground/70">
                    Occupation: <span className="capitalize">{agent.occupation}</span>
                  </p>
                  <p className="text-sm text-foreground/70">
                    Traits: {agent.traits.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="font-medium">
                    {agent.initialBalance} ARCA
                  </p>
                  {Number(agent.rewardBalance) > 0 && (
                    <>
                      <p className="text-sm text-green-500">
                        +{agent.rewardBalance} ARCA (Rewards)
                      </p>
                      <button
                        onClick={() => handleClaimReward(agent.id)}
                        className="px-3 py-1 mt-2 text-sm text-green-500 border border-green-500 rounded hover:bg-green-50 transition-colors"
                      >
                        Claim Rewards
                      </button>
                    </>
                  )}
                </div>
                {agent.isAlive && (
                  <button
                    onClick={() => handleKillAgent(agent.id)}
                    className="px-3 py-1 text-sm text-red-500 border border-red-500 rounded hover:bg-red-50 transition-colors"
                  >
                    Kill Agent
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!agentDetails.length) && (
          <div className="text-center py-8 text-foreground/70">
            You don't have any agents yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
