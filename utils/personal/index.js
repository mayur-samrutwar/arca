import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { parseEther, formatEther } from 'viem';

const ARCA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_ARCA_TOKEN_ADDRESS;

// ABI for ARCA token
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

// Personal level functions
export const personalActions = {
  // Check ETH balance
  checkEthBalance: async (address) => {
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      });

      const balance = await publicClient.getBalance({ address });
      return formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to check ETH balance: ${error.message}`);
    }
  },

  // Check balance of an address
  checkBalance: async (address) => {
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      });

      const balanceWei = await publicClient.readContract({
        address: ARCA_TOKEN_ADDRESS,
        abi: arcaAbi,
        functionName: 'balanceOf',
        args: [address],
      });

      return formatEther(balanceWei);
    } catch (error) {
      throw new Error(`Failed to check balance: ${error.message}`);
    }
  },

  // Transfer ARCA tokens
  transfer: async (privateKey, recipientAddress, amount) => {
    try {
      if (!privateKey || typeof privateKey !== 'string') {
        throw new Error('Invalid private key');
      }
      if (!amount || isNaN(amount)) {
        throw new Error('Invalid amount');
      }

      // Clean up the private key format
      const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      
      const account = privateKeyToAccount(cleanPrivateKey);
      
      // Check ETH balance first
      const ethBalance = await personalActions.checkEthBalance(account.address);
      if (parseFloat(ethBalance) < 0.01) { // Require at least 0.01 ETH for gas
        throw new Error('Insufficient ETH for gas fees. Please fund your agent wallet with some ETH first.');
      }

      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
      });

      // Check ARCA balance
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      });

      const arcaBalance = await publicClient.readContract({
        address: ARCA_TOKEN_ADDRESS,
        abi: arcaAbi,
        functionName: 'balanceOf',
        args: [account.address],
      });

      const amountInWei = parseEther(amount);
      if (amountInWei > arcaBalance) {
        throw new Error(`Insufficient ARCA balance. Available: ${formatEther(arcaBalance)} ARCA`);
      }

      const hash = await walletClient.writeContract({
        address: ARCA_TOKEN_ADDRESS,
        abi: arcaAbi,
        functionName: 'transfer',
        args: [recipientAddress, amountInWei]
      });

      return hash;
    } catch (error) {
      console.error('Transfer error details:', error);
      throw new Error(`Transfer failed: ${error.message}`);
    }
  },

  // Donate to a cause or organization
  donate: async (privateKey, organizationAddress, amount) => {
    try {
      return await personalActions.transfer(privateKey, organizationAddress, amount);
    } catch (error) {
      throw new Error(`Donation failed: ${error.message}`);
    }
  },

  // Pay rent to landlord
  payRent: async (privateKey, landlordAddress, amount) => {
    try {
      return await personalActions.transfer(privateKey, landlordAddress, amount);
    } catch (error) {
      throw new Error(`Rent payment failed: ${error.message}`);
    }
  },

  // Send gift to another person
  sendGift: async (privateKey, recipientAddress, amount) => {
    try {
      return await personalActions.transfer(privateKey, recipientAddress, amount);
    } catch (error) {
      throw new Error(`Gift sending failed: ${error.message}`);
    }
  }
};
