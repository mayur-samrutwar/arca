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