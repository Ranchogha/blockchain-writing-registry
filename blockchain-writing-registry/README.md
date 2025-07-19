# ✍️ Blockchain-Based Writing Registry

> Protect your words. Prove your authorship. Powered by blockchain.

A decentralized application (dApp) that allows writers and content creators to register proof of authorship for written works on-chain by submitting cryptographic hashes of their content. Built for the Camp Network (BaseCAMP), this platform supports provenance tracking, creator licensing, and AI-friendly attribution.

---

## 🔗 Live Demo

Coming soon...

---

## 🚀 Features

- ✅ Register a written work as a cryptographic hash (SHA-256)
- 🧾 Attach metadata (title, license type, optional Twitter handle)
- ⛓️ Store and verify on-chain proof of ownership on Camp Network BaseCAMP
- 🔍 View public registry of previously submitted works
- 🛡️ Prevent duplicate registrations
- 🧠 Future-ready for plagiarism checks, AI attribution, and agent-based licensing
- 💼 Wallet integration (MetaMask, WalletConnect)
- 📱 Responsive design with modern UI
- 🔄 Real-time transaction status
- 📊 Transparent event emission for provenance

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Blockchain** | Camp Network BaseCAMP (EVM L1) | Decentralized storage and verification |
| **Smart Contract** | Solidity 0.8.20+ | On-chain logic and data storage |
| **Frontend** | Next.js 14 (App Router) | Modern React framework |
| **Styling** | Tailwind CSS + shadcn/ui | Beautiful, responsive UI |
| **Web3** | wagmi + viem | Wallet and contract interaction |
| **Hashing** | crypto-js | SHA-256 content hashing |
| **Deployment** | Remix IDE + Vercel | Smart contract + frontend hosting |

---

## 🌐 Camp Network Configuration

### Network Details
- **Network Name**: Camp Network BaseCAMP
- **Chain ID**: 123420001114
- **Currency Symbol**: CAMP
- **RPC Endpoints**:
  - Primary: `https://rpc.basecamp.t.raas.gelato.cloud`
  - Secondary: `https://rpc-campnetwork.xyz`
- **Block Explorer**: https://basecamp.cloud.blockscout.com/

### MetaMask Configuration
Add Camp Network to MetaMask with these settings:
```json
{
  "chainId": "0x75b7c8b4",
  "chainName": "Camp Network BaseCAMP",
  "nativeCurrency": {
    "name": "CAMP",
    "symbol": "CAMP",
    "decimals": 18
  },
  "rpcUrls": [
    "https://rpc.basecamp.t.raas.gelato.cloud",
    "https://rpc-campnetwork.xyz"
  ],
  "blockExplorerUrls": ["https://basecamp.cloud.blockscout.com/"]
}
```

---

## 🏗️ Architecture

### Smart Contract (`WritingRegistry.sol`)
```solidity
// Core registration function
function registerProof(
    string calldata hash,        // SHA-256 hash of content
    string calldata title,       // Content title
    string calldata license,     // License type
    string calldata twitterHandle // Optional attribution
) external

// Data structure for stored proofs
struct Proof {
    string title;
    string license;
    string twitterHandle;
    uint256 timestamp;
    address creator;
}
```

### Frontend Components
- **ContentSubmission**: Form for registering new content with real-time hashing
- **RegistryViewer**: Search and display registered content by hash
- **Header**: Wallet connection and navigation
- **Providers**: Web3 context and state management

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or compatible wallet
- CAMP tokens for gas fees on Camp Network BaseCAMP

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ranchogha/blockchain-writing-registry.git
   cd blockchain-writing-registry
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Add your deployed contract address
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

### Smart Contract Deployment

1. **Deploy via Remix IDE**
   - Open [remix.ethereum.org](https://remix.ethereum.org/)
   - Upload `WritingRegistry.sol`
   - Compile and deploy to Camp Network BaseCAMP
   - Copy contract address to `.env.local`

2. **Verify contract**
   - Use [BaseCAMP Explorer](https://basecamp.cloud.blockscout.com/)
   - Verify source code for transparency

---

## 📖 Usage Guide

### For Content Creators

1. **Connect Wallet**
   - Click "Connect Wallet" in the header
   - Ensure you're on Camp Network BaseCAMP
   - Have CAMP tokens for gas fees

2. **Register Content**
   - Paste your written content in the form
   - Add title and select license type
   - Optionally add Twitter handle for attribution
   - Click "Register Content"

3. **Verify Registration**
   - Check transaction status
   - Use Registry Viewer to confirm your content
   - View transaction on [BaseCAMP Explorer](https://basecamp.cloud.blockscout.com/)

### For Content Verifiers

1. **Search Registry**
   - Use the Registry Viewer component
   - Enter the SHA-256 hash of content
   - View registration details and metadata

2. **Verify Authenticity**
   - Confirm content is registered on Camp Network BaseCAMP
   - Check creator address and timestamp
   - Review license information

---

## 🔧 Configuration

### Environment Variables
```env
# Required
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Your deployed contract address

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CAMP_NETWORK_RPC=https://rpc.basecamp.t.raas.gelato.cloud
```

### Supported License Types
- MIT License
- Creative Commons Attribution
- Creative Commons Attribution-ShareAlike
- Creative Commons Attribution-NonCommercial
- All Rights Reserved
- Public Domain

---

## 🎯 Camp Network Integration

This dApp is specifically designed for Camp Network BaseCAMP's mission:

### Creator Sovereignty
- Full control over content registration
- Customizable licensing terms
- Transparent ownership verification

### AI Agent Ready
- Structured metadata for AI consumption
- Clear attribution for training data
- Provenance chain for compliance

### Transparent Attribution
- Public registry for content discovery
- Event emission for tracking
- Immutable timestamp and creator data

---

## 🚀 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically

### Smart Contract (Remix)
1. Open Remix IDE
2. Upload and compile contract
3. Deploy to Camp Network BaseCAMP
4. Verify on [BaseCAMP Explorer](https://basecamp.cloud.blockscout.com/)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 🔍 API Reference

### Smart Contract Functions

| Function | Type | Description |
|----------|------|-------------|
| `registerProof` | Write | Register new content hash |
| `getProof` | View | Retrieve content metadata |
| `isHashRegistered` | View | Check registration status |

### Events
```solidity
event ProofRegistered(
    string indexed hash,
    string title,
    string license,
    string twitterHandle,
    uint256 timestamp,
    address indexed creator
);
```

---

## 🤝 Contributing

This project follows a custom license that allows free use but prevents commercial exploitation and ownership claims.

### Development
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

---

## 📄 License

Custom License - Free Use, No Commercial Exploitation

Copyright (c) 2025 Ranchogha

This software is provided free of charge for non-commercial use. Commercial use, selling, or claiming ownership is prohibited without explicit permission.

---

## 🔗 Links

- **Repository**: https://github.com/Ranchogha/blockchain-writing-registry
- **Camp Network**: https://camp.network
- **BaseCAMP Explorer**: https://basecamp.cloud.blockscout.com/
- **Remix IDE**: https://remix.ethereum.org
- **Vercel**: https://vercel.com

## 🆘 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the [deployment guide](./DEPLOYMENT.md)
- Review the smart contract documentation

---

Built with ❤️ for the Camp Network BaseCAMP ecosystem

> **Empowering creators with blockchain-based authorship verification**