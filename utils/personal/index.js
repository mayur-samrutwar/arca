import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { parseEther, formatEther } from 'viem';

const ARCA_TOKEN_ADDRESS = '0x539C7e0233004036c6bc96A1eEF6b19905fdb188';

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
      const account = privateKeyToAccount(`0x${privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey}`);
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
      });

      const hash = await walletClient.writeContract({
        address: ARCA_TOKEN_ADDRESS,
        abi: arcaAbi,
        functionName: 'transfer',
        args: [recipientAddress, parseEther(amount)]
      });

      return hash;
    } catch (error) {
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
