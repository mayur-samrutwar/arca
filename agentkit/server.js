const express = require('express');
const { 
  AgentKit, 
  CdpWalletProvider,
  wethActionProvider,
  pythActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider
} = require('@coinbase/agentkit');
const cors = require('cors');
const connectDB = require('./db/connection');
const Agent = require('./db/models/Agent');
const path = require('path');
const { formatEther, parseEther } = require('viem');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Initial env check:', {
  NODE_ENV: process.env.NODE_ENV,
  ARCA_TOKEN_ADDRESS: process.env.ARCA_TOKEN_ADDRESS,
});

// Add some debugging to verify the environment variables are loaded
console.log('Environment variables loaded:', {
  CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME ? 'Set' : 'Not set',
  CDP_API_KEY_PRIVATE_KEY: process.env.CDP_API_KEY_PRIVATE_KEY ? 'Set' : 'Not set',
  NETWORK_ID: process.env.NETWORK_ID,
  ARCA_TOKEN_ADDRESS: process.env.ARCA_TOKEN_ADDRESS,
});

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Generate wallet endpoint
app.post('/generate-wallet', async (req, res) => {
  const { ownerAddress } = req.body;
  
  try {
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    const walletAddress = await walletProvider.getAddress();
    const walletData = await walletProvider.exportWallet();
    
    // Save to MongoDB
    await Agent.create({
      ownerAddress,
      agentAddress: walletAddress,
      cdpWalletData: walletData
    });

    res.json({ address: walletAddress });
  } catch (error) {
    console.error('Wallet generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize agent endpoint
app.post('/init-agent', async (req, res) => {
  const { agentAddress, ownerAddress } = req.body;
  
  try {
    if (!agentAddress || !ownerAddress) {
      throw new Error('Agent address and owner address are required');
    }

    console.log('Initializing agent:', { agentAddress, ownerAddress });

    // Find agent in MongoDB
    const agent = await Agent.findOne({ 
      agentAddress: agentAddress,
      ownerAddress: ownerAddress 
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Verify ARCA token address is set
    if (!process.env.ARCA_TOKEN_ADDRESS) {
      throw new Error('ARCA_TOKEN_ADDRESS environment variable is not set');
    }

    // Format the wallet data as expected by CDP
    const walletData = {
      walletId: agent.cdpWalletData.walletId,
      seed: agent.cdpWalletData.seed,
      networkId: agent.cdpWalletData.networkId
    };

    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      networkId: process.env.NETWORK_ID || "base-sepolia",
      cdpWalletData: JSON.stringify(walletData)
    };

    // Create new wallet provider
    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    
    // Initialize AgentKit with action providers
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        walletActionProvider(),
        wethActionProvider(),
        pythActionProvider(),
        erc20ActionProvider({
          tokens: {
            ARCA: {
              address: process.env.ARCA_TOKEN_ADDRESS,
              decimals: 18
            }
          }
        }),
        cdpApiActionProvider(config),
        cdpWalletActionProvider(config),
      ],
    });

    // Add this logging to debug the initialization
    console.log('AgentKit initialized with:', {
      hasWalletProvider: !!agentkit.walletProvider,
      hasWeth: !!agentkit.weth,
      hasErc20: !!agentkit.erc20,
      availableProperties: Object.keys(agentkit)
    });

    // Store in memory temporarily for the session
    global.agentWallets = global.agentWallets || new Map();
    global.agentWallets.set(agentAddress, agentkit);
    
    console.log('Agent initialized successfully:', agentAddress);
    res.json({ success: true });
  } catch (error) {
    console.error('Agent initialization failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle agent actions
app.post('/agent-action', async (req, res) => {
  const { agentAddress, ownerAddress, action, params } = req.body;
  
  try {
    console.log('Agent action request:', { agentAddress, ownerAddress, action, params });
    
    // Verify agent exists and ownership
    const agent = await Agent.findOne({ 
      agentAddress,
      ownerAddress 
    });

    if (!agent) {
      throw new Error('Agent not found or unauthorized');
    }

    const agentkit = global.agentWallets.get(agentAddress);
    console.log('Retrieved agentkit:', {
      exists: !!agentkit,
      hasWeth: !!agentkit?.weth,
      hasWalletProvider: !!agentkit?.walletProvider,
      availableProperties: agentkit ? Object.keys(agentkit) : []
    });

    if (!agentkit) {
      // If agent exists in DB but not in memory, try to reinitialize
      console.log('Agent not in memory, attempting to reinitialize...');
      
      const walletData = {
        walletId: agent.cdpWalletData.walletId,
        seed: agent.cdpWalletData.seed,
        networkId: agent.cdpWalletData.networkId
      };

      const config = {
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        networkId: process.env.NETWORK_ID || "base-sepolia",
        cdpWalletData: JSON.stringify(walletData)
      };

      const walletProvider = await CdpWalletProvider.configureWithWallet(config);
      const newAgentkit = await AgentKit.from({
        walletProvider,
        actionProviders: [
          walletActionProvider(),
          wethActionProvider(),
          pythActionProvider(),
          erc20ActionProvider({
            tokens: {
              ARCA: {
                address: process.env.ARCA_TOKEN_ADDRESS,
                decimals: 18
              }
            }
          }),
          cdpApiActionProvider(config),
          cdpWalletActionProvider(config),
        ],
      });

      global.agentWallets.set(agentAddress, newAgentkit);
      console.log('Agent reinitialized successfully');
      
      // Log the reinitialized agentkit properties
      console.log('Reinitialized agentkit with:', {
        hasWalletProvider: !!newAgentkit.walletProvider,
        hasWeth: !!newAgentkit.weth,
        availableProperties: Object.keys(newAgentkit)
      });
      
      return res.json({ success: true, message: 'Agent reinitialized. Please try your action again.' });
    }

    let result;
    switch (action) {
      case 'getWalletAddress':
        result = await agentkit.walletProvider.getAddress();
        break;
      case 'checkBalance':
        try {
          // Try to get ETH balance using walletProvider
          const address = params.address === 'sender' ? agentAddress : params.address;
          const balanceBigInt = await agentkit.walletProvider.getBalance(address);
          // Convert Wei to ETH and format as string
          result = formatEther(balanceBigInt);
          console.log('Balance result (ETH):', result);
        } catch (error) {
          console.error('Balance check error:', error);
          throw error;
        }
        break;
      case 'transfer':
        try {
          result = await agentkit.walletProvider.sendTransaction({
            to: params.recipientAddress,
            value: parseEther(params.amount)  // Convert ETH amount to Wei
          });
          console.log('Transfer result:', result);
        } catch (error) {
          console.error('Transfer error:', error);
          throw error;
        }
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Action failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});