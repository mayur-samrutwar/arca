import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// ARCA token ABI (minimal for transfer and balanceOf)
const arcaAbi = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export default function TestTransaction() {
  const [privateKey, setPrivateKey] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [balanceAddress, setBalanceAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [port, setPort] = useState('');
  const [testResponse, setTestResponse] = useState(null);

  const ARCA_TOKEN_ADDRESS = '0x539C7e0233004036c6bc96A1eEF6b19905fdb188';

  const checkBalance = async () => {
    if (!balanceAddress) return;
    
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      });

      const balanceWei = await publicClient.readContract({
        address: ARCA_TOKEN_ADDRESS,
        abi: arcaAbi,
        functionName: 'balanceOf',
        args: [balanceAddress],
      });

      setBalance(formatEther(balanceWei));
    } catch (error) {
      console.error('Balance check failed:', error);
      setBalance(null);
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    setStatus('Processing...');

    try {
      // Create account from private key
      const account = privateKeyToAccount(`0x${privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey}`);

      // Create wallet client
      const client = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
      });

      // Send transaction directly
      const hash = await client.writeContract({
        address: ARCA_TOKEN_ADDRESS,
        abi: arcaAbi,
        functionName: 'transfer',
        args: [recipient, parseEther(amount)]
      });
      
      setStatus(`Transaction sent! Hash: ${hash}`);
    } catch (error) {
      console.error('Transaction failed:', error);
      setStatus(`Transaction failed: ${error.message}`);
    }
  };

  const handleTestRequest = async () => {
    try {
      const response = await fetch(`http://localhost:${port}/generate-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log(data);
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResponse(`Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">ARCA Token Interface</h1>
      
      {/* Add Test Request Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test POST Request</h2>
        <div className="flex space-x-2">
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Enter port number"
          />
          <button
            onClick={handleTestRequest}
            className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
          >
            Test
          </button>
        </div>
        {testResponse && (
          <div className="mt-2 p-2 bg-white rounded border">
            <pre className="text-sm overflow-x-auto">
              {testResponse}
            </pre>
          </div>
        )}
      </div>

      {/* Balance Checker Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Check ARCA Balance</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={balanceAddress}
            onChange={(e) => setBalanceAddress(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Enter address"
          />
          <button
            onClick={checkBalance}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Check
          </button>
        </div>
        {balance !== null && (
          <div className="mt-2 text-sm">
            Balance: {balance} ARCA
          </div>
        )}
      </div>

      {/* Transfer Section */}
      <h2 className="text-xl font-semibold mb-4">Send ARCA Tokens</h2>
      <form onSubmit={handleTransaction} className="space-y-4">
        <div>
          <label className="block mb-2">Private Key:</label>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter private key"
            required
          />
        </div>
        <div>
          <label className="block mb-2">Recipient Address:</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="0x..."
            required
          />
        </div>
        <div>
          <label className="block mb-2">Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Amount in ARCA"
            required
            step="any"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Send Tokens
        </button>
      </form>
      {status && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}
