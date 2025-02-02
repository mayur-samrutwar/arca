import { useState, useEffect } from 'react';
import { Geist } from 'next/font/google';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { createAgent } from '../schemas/agent';
import { generateETHKeys } from '../utils/generate-key';
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
  { id: 'unemployed', name: 'Unemployed', price: 100n * BigInt(1e18) }
];

const ARCA_CITY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS;

export default function Deploy() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [selectedGender, setSelectedGender] = useState(GENDER_OPTIONS[0]);
  const [selectedOccupation, setSelectedOccupation] = useState(OCCUPATION_OPTIONS[0]);
  const [initialBalance, setInitialBalance] = useState(1000);
  const [totalPrice, setTotalPrice] = useState(
    OCCUPATION_OPTIONS[0].price + parseEther(String(1000))
  );

  // Add contract write hook
  const { data: hash, writeContract, isPending } = useWriteContract();

  // Add transaction receipt hook
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash,
    });

  // Add hook to read current agent count
  const { data: currentAgentCount } = useReadContract({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getCurrentAgentId',
    watch: true,
  });

  const updateTotalPrice = (occupation, balance) => {
    const balanceWei = parseEther(String(balance));
    const newTotalPrice = occupation.price + balanceWei;
    setTotalPrice(newTotalPrice);
  };

  const handleBalanceChange = (e) => {
    const newBalance = Number(e.target.value);
    setInitialBalance(newBalance);
    updateTotalPrice(selectedOccupation, newBalance);
  };

  const handleDeploy = async () => {
    try {
      const keys = generateETHKeys();
      const traits = ['ambitious', 'creative', 'determined'];

      // Convert balance to wei
      const initialBalanceWei = parseEther(String(initialBalance));
      
      // Calculate total cost (occupation cost + initial balance)
      const totalCost = selectedOccupation.price + initialBalanceWei;

      // Create account from private key - ensure the key is properly formatted
      const cityPrivateKey = process.env.NEXT_PUBLIC_ARCA_CITY_PRIVATE_KEY;
      const formattedPrivateKey = cityPrivateKey.startsWith('0x') ? cityPrivateKey : `0x${cityPrivateKey}`;
      const cityAccount = privateKeyToAccount(formattedPrivateKey);

      // Create public client for transaction receipts
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      });

      // Create wallet client
      const walletClient = createWalletClient({
        account: cityAccount,
        chain: baseSepolia,
        transport: http()
      });

      // Get agent's address from public key
      const agentAddress = keys.address; // Use address directly from generateETHKeys

      // Send 0.02 ETH to the agent
      const ethTx = await walletClient.sendTransaction({
        to: agentAddress,
        value: parseEther('0.02')
      });

      // Wait for ETH transfer to complete using public client
      await publicClient.waitForTransactionReceipt({ hash: ethTx });

      // Create agent on contract
      const args = [
        name,
        selectedGender.id,
        selectedOccupation.id,
        initialBalanceWei,
        traits,
        keys.publicKey,
        keys.privateKey
      ];

      await writeContract({
        address: ARCA_CITY_CONTRACT_ADDRESS,
        abi: arcaAbi,
        functionName: 'createAgent',
        args,
      });

      // Start tax collection for the new agent
      // The new agent ID will be currentAgentCount + 1
      const { agentTaxManager } = await import('../utils/tasks/agent-tax');
      agentTaxManager.startTaxCollection(Number(currentAgentCount) + 1, keys.privateKey);

    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  // Add approval check and function
  const handleApproveAndDeploy = async () => {
    try {
      // First approve ARCA tokens
      await writeContract({
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

      // Then create agent
      handleDeploy();
    } catch (error) {
      console.error('Failed to approve tokens:', error);
    }
  };

  // Update initial total price
  useEffect(() => {
    updateTotalPrice(OCCUPATION_OPTIONS[0], initialBalance);
  }, []);

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
          disabled={isPending || isConfirming}
          className={`bg-black text-white hover:bg-zinc-900 px-6 py-2 rounded-lg transition-colors text-sm font-medium ${
            (isPending || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isPending ? 'Approving...' : 
           isConfirming ? 'Creating...' : 
           'Deploy Agent'}
        </button>
      </div>

      {/* Add success message */}
      {isConfirmed && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Agent created successfully!
        </div>
      )}
    </div>
  );
}