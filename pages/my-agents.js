import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import arcaAbi from '../contracts/abi/arca.json';

const ARCA_CITY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS;

export default function MyAgents() {
  const [agentDetails, setAgentDetails] = useState(null);
  const [showKillWarning, setShowKillWarning] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  // Get agent ID
  const { data: myAgentId, isError, isLoading: isLoadingId } = useReadContract({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getMyAgent',
    account: address,
    watch: true,
  });

  // Fetch agent info
  const { data: agentInfo, isLoading: isLoadingInfo } = useReadContract({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getAgentInfo',
    args: myAgentId ? [myAgentId] : undefined,
    enabled: Boolean(myAgentId),
  });

  // Format agent info when available
  useEffect(() => {
    if (!agentInfo || !myAgentId) return;

    const formattedAgent = {
      id: myAgentId,
      name: agentInfo[0],
      owner: agentInfo[1],
      gender: agentInfo[2],
      occupation: agentInfo[3],
      initialBalance: formatEther(agentInfo[4]),
      traits: agentInfo[5],
      birthDate: new Date(Number(agentInfo[6]) * 1000),
      expiryDate: new Date(Number(agentInfo[7]) * 1000),
      isAlive: agentInfo[8],
      rewardBalance: formatEther(agentInfo[9]),
      publicKey: agentInfo[10],
    };

    setAgentDetails(formattedAgent);
  }, [agentInfo, myAgentId]);

  // Add handleWithdraw function
  const handleWithdraw = async () => {
    if (!withdrawAmount || !agentDetails) return;
    
    try {
      await writeContract({
        address: ARCA_CITY_CONTRACT_ADDRESS,
        abi: arcaAbi,
        functionName: 'withdrawFromAgent',
        args: [agentDetails.id, parseEther(withdrawAmount)]
      });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    } catch (error) {
      console.error('Failed to withdraw:', error);
    }
  };

  // Update handleKillAgent to include confirmation
  const handleKillAgent = async (agentId) => {
    try {
      await writeContract({
        address: ARCA_CITY_CONTRACT_ADDRESS,
        abi: arcaAbi,
        functionName: 'killAgent',
        args: [agentId]
      });
      setShowKillWarning(false);
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
  if (isLoadingId || isLoadingInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading agent...</div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500 text-center">Error loading agent</div>
      </div>
    );
  }

  // Show no wallet connected state
  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Please connect your wallet to view your agent</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Agent</h1>
        <div className="text-sm text-gray-500">
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      </div>

      <div className="grid gap-4">
        {agentDetails ? (
          <div
            className="p-4 rounded-lg border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{agentDetails.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    agentDetails.isAlive ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-foreground/70">
                    {agentDetails.isAlive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-foreground/70">
                    Occupation: <span className="capitalize">{agentDetails.occupation}</span>
                  </p>
                  <p className="text-sm text-foreground/70">
                    Traits: {agentDetails.traits.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="font-medium">
                    {agentDetails.initialBalance} ARCA
                  </p>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="px-3 py-1 mt-2 text-sm text-blue-500 border border-blue-500 rounded hover:bg-blue-50 transition-colors"
                  >
                    Withdraw
                  </button>
                  {Number(agentDetails.rewardBalance) > 0 && (
                    <>
                      <p className="text-sm text-green-500">
                        +{agentDetails.rewardBalance} ARCA (Rewards)
                      </p>
                      <button
                        onClick={() => handleClaimReward(agentDetails.id)}
                        className="px-3 py-1 mt-2 text-sm text-green-500 border border-green-500 rounded hover:bg-green-50 transition-colors"
                      >
                        Claim Rewards
                      </button>
                    </>
                  )}
                </div>
                {agentDetails.isAlive && (
                  <button
                    onClick={() => setShowKillWarning(true)}
                    className="px-3 py-1 text-sm text-red-500 border border-red-500 rounded hover:bg-red-50 transition-colors"
                  >
                    Kill Agent
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-foreground/70">
            You don't have an agent yet. Create one to get started!
          </div>
        )}
      </div>

      {/* Kill Warning Modal */}
      {showKillWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">⚠️ Warning: Kill Agent</h3>
            <p className="mb-4 text-foreground/70">
              Are you sure you want to kill your agent? This action:
              <ul className="list-disc ml-4 mt-2">
                <li>Cannot be undone</li>
                <li>Will lose all agent progress</li>
                <li>Will forfeit any unclaimed rewards</li>
              </ul>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowKillWarning(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleKillAgent(agentDetails.id)}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Kill Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Withdraw ARCA</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount (ARCA)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                max={agentDetails?.initialBalance}
              />
              <p className="text-sm text-foreground/70 mt-2">
                Available: {agentDetails?.initialBalance} ARCA
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > Number(agentDetails?.initialBalance)}
                className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
