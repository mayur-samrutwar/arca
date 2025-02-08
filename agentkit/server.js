const express = require('express');
const { CdpWalletProvider } = require('@coinbase/agentkit');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/generate-wallet', async (req, res) => {
  console.log("Generating wallet...");
  try {
    // Read the CDP API key file
    const keyFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'cdp_api_key.json'), 'utf8'));

    const config = {
      apiKeyName: keyFile.name,
      apiKeyPrivateKey: keyFile.privateKey,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    const walletAddress = await walletProvider.getAddress();
    console.log(walletAddress);
    res.json({ address: walletAddress });
  } catch (error) {
    console.error('Wallet generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});