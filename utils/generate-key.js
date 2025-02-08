import { ethers } from "ethers";

// Generate Ethereum-compatible keys
export const generateETHKeys = () => {
  const wallet = ethers.Wallet.createRandom();
  
  return {
    address: wallet.address,
    publicKey: wallet.publicKey,
    privateKey: wallet.privateKey
  };
};

export const generateAgentWallet = async () => {
  try {
    const response = await fetch('http://localhost:3001/generate-wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to generate wallet');
    }

    console.log(response);
    console.log("wallet generated");

    const data = await response.json();
    return {
      address: data.address
    };
  } catch (error) {
    console.error("Failed to generate wallet:", error);
    throw error;
  }
};