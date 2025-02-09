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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Agent Profile</h1>
        <div className="text-sm text-gray-500">
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      </div>

      {agentDetails ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-500">
            <div className="absolute -bottom-16 left-8">
              <img
                src={`https://api.dicebear.com/7.x/personas/svg?seed=${agentDetails.name}`}
                alt={agentDetails.name}
                className="w-32 h-32 rounded-xl border-4 border-white dark:border-gray-800 bg-white"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="pt-20 px-8 pb-8">
            {/* Agent Status and Actions */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">{agentDetails.name}</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    agentDetails.isAlive ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {agentDetails.isAlive ? 'Active Agent' : 'Inactive Agent'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {agentDetails.isAlive && (
                  <button
                    onClick={() => setShowKillWarning(true)}
                    className="px-4 py-2 text-sm font-medium text-red-500 border border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Kill Agent
                  </button>
                )}
              </div>
            </div>

            {/* Agent Details Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupation</h3>
                  <p className="mt-1 text-lg capitalize">{agentDetails.occupation}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</h3>
                  <p className="mt-1 text-lg capitalize">{agentDetails.gender}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Traits</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {agentDetails.traits.map((trait, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Financial Info */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</h3>
                  <p className="mt-1 text-2xl font-bold">{agentDetails.initialBalance} ARCA</p>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="mt-2 px-4 py-2 w-full text-sm font-medium text-blue-500 border border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Withdraw
                  </button>
                </div>

                {Number(agentDetails.rewardBalance) > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Available Rewards</h3>
                    <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                      {agentDetails.rewardBalance} ARCA
                    </p>
                    <button
                      onClick={() => handleClaimReward(agentDetails.id)}
                      className="mt-2 px-4 py-2 w-full text-sm font-medium text-green-500 border border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      Claim Rewards
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Info */}
            <div className="border-t dark:border-gray-700 pt-6">
              <div className="flex gap-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
                  <p className="mt-1">{agentDetails.birthDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires</h3>
                  <p className="mt-1">{agentDetails.expiryDate.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h3 className="text-xl font-medium mb-2">No Agent Found</h3>
          <p className="text-gray-600 dark:text-gray-300">
            You don't have an agent yet. Create one to get started!
          </p>
        </div>
      )}

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
