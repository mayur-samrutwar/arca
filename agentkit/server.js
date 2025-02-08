const express = require('express');
const { CdpWalletProvider } = require('@coinbase/agentkit');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/generate-wallet', async (req, res) => {
  try {
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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