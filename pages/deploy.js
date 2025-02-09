import { useState, useEffect } from 'react';
import { Geist } from 'next/font/google';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { createAgent } from '../schemas/agent';
import arcaAbi from '../contracts/abi/arca.json';
import { createWalletClient, http, waitForTransactionReceipt, getAddress, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const geist = Geist({ subsets: ['latin'] });

// Configuration options
const AVATAR_OPTIONS = [
  { id: 'felix', seed: 'Felix' },
  { id: 'john', seed: 'John' },
  { id: 'sarah', seed: 'Sarah' },
  { id: 'mike', seed: 'Mike' }
];

const GENDER_OPTIONS = [
  { id: 'male', name: 'Male', price: 0n },
  { id: 'female', name: 'Female', price: 0n }
];

// Match exactly with contract's occupationCosts mapping keys
const OCCUPATION_OPTIONS = [
  { id: 'researcher', name: 'Researcher', price: 500n * BigInt(1e18) },
  { id: 'banker', name: 'Banker', price: 400n * BigInt(1e18) },
  { id: 'judge', name: 'Judge', price: 600n * BigInt(1e18) },
  { id: 'council', name: 'Council', price: 700n * BigInt(1e18) },
];

const ARCA_CITY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS;

export default function Deploy() {
  const { address } = useAccount();

  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [selectedGender, setSelectedGender] = useState(GENDER_OPTIONS[0]);
  const [selectedOccupation, setSelectedOccupation] = useState(OCCUPATION_OPTIONS[0]);
  const [initialBalance, setInitialBalance] = useState(1000);
  const [totalPrice, setTotalPrice] = useState(
    OCCUPATION_OPTIONS[0].price + parseEther(String(1000))
  );
  const [deploymentStatus, setDeploymentStatus] = useState('');

  // Add contract write hooks
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { data: approvalHash, writeContract: writeApproval } = useWriteContract();

  // Add transaction receipt hooks
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash,
    });

  const { 
    isLoading: isApprovalConfirming, 
    isSuccess: isApprovalConfirmed 
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  const updateTotalPrice = (occupation, balance) => {
    try {
      const balanceWei = parseEther(String(balance));
      const newTotalPrice = occupation.price + balanceWei;
      console.log('New total price:', newTotalPrice.toString());
      setTotalPrice(newTotalPrice);
    } catch (error) {
      console.error('Error calculating total price:', error);
    }
  };

  const handleBalanceChange = (e) => {
    const newBalance = Number(e.target.value);
    setInitialBalance(newBalance);
    updateTotalPrice(selectedOccupation, newBalance);
  };

  // Update total price when occupation or balance changes
  useEffect(() => {
    updateTotalPrice(selectedOccupation, initialBalance);
  }, [selectedOccupation, initialBalance]);

  const handleApproveAndDeploy = async () => {
    try {
      if (!totalPrice) {
        throw new Error('Total price not calculated');
      }

      console.log('Approving amount:', totalPrice.toString());
      setDeploymentStatus('Approving ARCA tokens...');
      
      // First approve ARCA tokens
      await writeApproval({
        address: process.env.NEXT_PUBLIC_ARCA_TOKEN_ADDRESS,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ type: 'bool' }]
          }
        ],
        functionName: 'approve',
        args: [ARCA_CITY_CONTRACT_ADDRESS, totalPrice]
      });

    } catch (error) {
      console.error('Failed to approve tokens:', error);
      setDeploymentStatus(`Failed to approve tokens: ${error.message}`);
    }
  };

  // Add useEffect to handle approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed) {
      setDeploymentStatus('Approval confirmed. Creating agent...');
      handleDeploy();
    }
  }, [isApprovalConfirmed]);

  const handleDeploy = async () => {
    try {
      if (!address) {
        throw new Error('Please connect your wallet first');
      }

      console.log("Starting deployment process...");
      const traits = ['ambitious', 'creative', 'determined'];
      
      // Generate wallet with owner address
      console.log("Generating wallet...");
      const response = await fetch('http://localhost:3001/generate-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerAddress: address // Now address is properly defined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate wallet');
      }

      const { address: agentAddress } = await response.json();
      console.log("Generated wallet address:", agentAddress);
      
      // Convert balance to wei
      const initialBalanceWei = parseEther(String(initialBalance));
      console.log("Initial balance in wei:", initialBalanceWei.toString());

      // Prepare agent creation args
      const args = [
        name,
        selectedGender.id,
        selectedOccupation.id,
        initialBalanceWei,
        traits,
        agentAddress // Use the generated agent address
      ];
      
      console.log("Creating agent with args:", args);

      // Create agent
      await writeContract({
        address: ARCA_CITY_CONTRACT_ADDRESS,
        abi: arcaAbi,
        functionName: 'createAgent',
        args,
        value: parseEther('0.02') // Send ETH with the transaction
      });

      setDeploymentStatus('Agent creation transaction submitted');
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentStatus(`Deployment failed: ${error.message}`);
    }
  };

  const formatPrice = (priceInWei) => {
    return Number(priceInWei) / Number(1e18);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-normal mb-8">Deploy Agent</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto pr-4">
          {/* Name Input */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Name</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter agent name"
              className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          {/* Avatar Selection */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Avatar</h2>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`p-2 rounded-lg border transition-all ${
                    selectedAvatar.id === avatar.id
                      ? 'border-black shadow-sm'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${avatar.seed}`}
                    alt={`Avatar ${avatar.id}`}
                    className="w-12 h-12 mx-auto"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Gender Selection */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Gender</h2>
            <div className="grid grid-cols-2 gap-4">
              {GENDER_OPTIONS.map((gender) => (
                <button
                  key={gender.id}
                  onClick={() => setSelectedGender(gender)}
                  className={`p-4 rounded-lg transition-all ${
                    selectedGender.id === gender.id
                      ? 'border border-black  shadow-sm'
                      : 'border border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-sm">{gender.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Occupation Selection */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Occupation</h2>
            <div className="grid grid-cols-2 gap-4">
              {OCCUPATION_OPTIONS.map((occupation) => (
                <button
                  key={occupation.id}
                  onClick={() => {
                    setSelectedOccupation(occupation);
                    updateTotalPrice(occupation, initialBalance);
                  }}
                  className={`p-4 rounded-lg border ${
                    selectedOccupation.id === occupation.id
                      ? 'border-black'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-sm">{occupation.name}</div>
                  <div className="text-xs text-zinc-500">
                    {formatPrice(occupation.price)} $ARCA
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Initial Balance Input */}
          <div className="border border-zinc-200 p-6 rounded-lg">
            <h2 className="text-sm font-medium mb-4">Initial Balance</h2>
            <input
              type="number"
              value={initialBalance}
              onChange={handleBalanceChange}
              min="0"
              step="100"
              className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm"
            />
          </div>
        </div>

        {/* Preview panel - Update to show name */}
        <div className="border border-zinc-200 p-6 rounded-lg sticky top-8 h-fit">
          <h2 className="text-sm font-medium mb-4">Preview</h2>
          <div className="aspect-square relative bg-zinc-50 rounded-lg mb-4">
            <img
              src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${selectedAvatar.seed}`}
              alt="Selected Avatar"
              className="w-full h-full p-8"
            />
          </div>
          <div className="space-y-2 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Name</span>
              <span>{name || 'Unnamed Agent'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Gender</span>
              <span>{selectedGender.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Occupation</span>
              <span>{selectedOccupation.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Initial Balance</span>
              <span>{initialBalance} $ARCA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Update Deploy Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-lg p-2 shadow-lg">
        <div className="text-sm font-medium">
          Total Price: <span className="text-zinc-500">
            {formatPrice(totalPrice)} $ARCA
          </span>
        </div>
        <button 
          onClick={handleApproveAndDeploy}
          disabled={isPending || isConfirming || isApprovalConfirming}
          className={`bg-black text-white hover:bg-zinc-900 px-6 py-2 rounded-lg transition-colors text-sm font-medium ${
            (isPending || isConfirming || isApprovalConfirming) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isApprovalConfirming ? 'Approving...' : 
           isPending ? 'Creating...' : 
           isConfirming ? 'Confirming...' : 
           'Deploy Agent'}
        </button>
      </div>

      {/* Add deployment status message */}
      {deploymentStatus && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          {deploymentStatus}
        </div>
      )}

      {/* Success message */}
      {isConfirmed && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Agent created successfully!
        </div>
      )}
    </div>
  );
}