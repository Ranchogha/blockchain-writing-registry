# ✍️ Blockchain-Based Writing Registry (Hybrid Edition)

> Protect your words. Prove your authorship. Powered by blockchain with Origin SDK UI.
> 
> **Latest Update**: Hybrid architecture implemented - Origin SDK UI + WritingRegistry smart contract backend.

A decentralized application (dApp) that allows writers and content creators to register proof of authorship for written works on-chain by submitting cryptographic hashes of their content. Built for the Camp Network (BaseCAMP), this platform combines the **WritingRegistry smart contract** for blockchain transactions with the **Origin SDK** for beautiful UI and content display.

---

## 🚀 Features

- ✅ Register a written work as a cryptographic hash (SHA-256) on WritingRegistry smart contract
- 🧾 Attach metadata (title, license type, optional Twitter handle)
- ⛓️ Store and verify on-chain proof of ownership on Camp Network BaseCAMP
- 🔍 View public registry with hybrid search (WritingRegistry + Origin SDK)
- 🛡️ Prevent duplicate registrations
- 🧠 Future-ready for plagiarism checks, AI attribution, and agent-based licensing
- 💼 Wallet & social login via Origin SDK (CampProvider, CampModal)
- 📱 Responsive design with modern UI powered by Origin SDK
- 🔄 Real-time transaction status
- 📊 Transparent event emission for provenance

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Blockchain** | Camp Network BaseCAMP (EVM L1) | Decentralized storage and verification |
| **Smart Contract** | WritingRegistry.sol | Content registration and verification |
| **Frontend UI** | [Origin SDK](https://docs.campnetwork.xyz/origin-v1/origin-sdk) | Beautiful content display and interface |
| **Frontend** | Next.js 14 (App Router) | Modern React framework |
| **Styling** | Tailwind CSS + shadcn/ui | Beautiful, responsive UI |
| **Hashing** | crypto-js | SHA-256 content hashing |
| **Deployment** | Vercel | Frontend hosting |

---

## 🌐 Camp Network Configuration

- **Network Name**: Camp Network BaseCAMP
- **Chain ID**: 123420001114
- **Currency Symbol**: CAMP
- **RPC Endpoints**:
  - Primary: `https://rpc.basecamp.t.raas.gelato.cloud`
  - Secondary: `https://rpc-campnetwork.xyz`
- **Block Explorer**: https://basecamp.cloud.blockscout.com/

---

## 🏗️ Architecture

### Hybrid Approach: Best of Both Worlds
- **WritingRegistry Backend**: All transactions use your smart contract for blockchain verification
- **Origin SDK UI**: Beautiful content display and interface powered by Origin SDK
- **Twitter Handle Creator**: Twitter handles are displayed as creators when available
- **Hybrid Search**: Checks both WritingRegistry contract and Origin SDK for complete data
- **Best of Both**: Origin's UI + Your smart contract's functionality

### Smart Contract Integration
- **Content Registration**: Uses `registerProof` function on WritingRegistry.sol
- **Content Verification**: Uses `getProof` and `isHashRegistered` functions
- **Blockchain Data**: Direct interaction with your deployed smart contract

### Origin SDK Integration
- **Authentication**: CampProvider and CampModal handle wallet and social login (Twitter, etc.)
- **Content Display**: Uses Origin SDK for beautiful content rendering and UI
- **Content Storage**: Uses Origin SDK for content uploads and metadata
- **Registry Search**: Hybrid search combining blockchain data with Origin content

### Main Components
- **ContentSubmission**: Form for registering new content on WritingRegistry contract
- **RegistryViewer**: Hybrid search and display (WritingRegistry + Origin SDK)
- **Header**: CampModal for wallet/social login
- **Providers**: CampProvider and QueryClientProvider for app context

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or compatible wallet
- CAMP tokens for gas fees on Camp Network BaseCAMP
- [Origin developer account](https://docs.campnetwork.xyz/origin-v1/getting-started) to obtain your Client ID

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
   cp env.example .env.local
   # Add your Origin Client ID and API URLs
   ```
   Example .env.local:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=your-deployed-writingregistry-contract-address
   NEXT_PUBLIC_CAMP_NETWORK_RPC=https://rpc.basecamp.t.raas.gelato.cloud
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
   NEXT_PUBLIC_ORIGIN_CLIENT_ID=your-origin-client-id
   NEXT_PUBLIC_ORIGIN_API_KEY=your-origin-api-key
   NEXT_PUBLIC_SUBGRAPH_URL=https://api.goldsky.com/api/public/project_cmdhxq7767k6a01umch9m1nq0/subgraphs/blockchain-writing-strategy/1.0.0/gn
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 📝 Usage

### Registering Content
1. **Connect your wallet** using the CampModal in the header
2. **Switch to Camp Network BaseCAMP** (Chain ID: 123420001114)
3. **Fill out the registration form**:
   - Paste your written content
   - Add a title
   - Select a license type
   - Add your Twitter handle (without @ symbol)
4. **Click "Register Content"** - This will:
   - Generate a SHA-256 hash of your content
   - Call `registerProof` on the WritingRegistry contract
   - Upload content to Origin SDK for display
   - Store Twitter data if provided

### Searching Content
1. **Enter a content hash** (66-character hex string starting with 0x)
2. **Click Search** - This will:
   - Check WritingRegistry contract for blockchain verification
   - Check Origin SDK for content display
   - Show combined results with Origin's beautiful UI
3. **View results** with verification status and content preview
4. **How it works**: Enter the content hash, search and confirm your content has been uploaded.

---

## 🔧 Smart Contract Functions

### WritingRegistry.sol
- `registerProof(bytes32 contentHash, string memory title, string memory license, string memory twitterHandle)` - Register new content
- `getProof(bytes32 contentHash)` - Retrieve proof data
- `isHashRegistered(bytes32 contentHash)` - Check if hash is registered

### Events
- `ProofRegistered(bytes32 indexed contentHash, address indexed owner, string title, string license, string twitterHandle, uint256 timestamp)` - Emitted when content is registered

---

## 🚀 Deployment

### Smart Contract Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Frontend Deployment
1. **Deploy to Vercel**:
   ```bash
   npm run build
   vercel --prod
   ```

2. **Set environment variables** in Vercel dashboard
3. **Update contract address** in environment variables

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🔗 Links

- **Live Demo**: [blockchain-writing-registry.vercel.app](https://blockchain-writing-registry.vercel.app)
- **Smart Contract**: [WritingRegistry.sol](./WritingRegistry.sol)
- **Origin SDK Docs**: [docs.campnetwork.xyz/origin-v1/origin-sdk](https://docs.campnetwork.xyz/origin-v1/origin-sdk)
- **Camp Network**: [campnetwork.xyz](https://campnetwork.xyz)

---

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](../../issues) page
2. Review the [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
3. Create a new issue with detailed information

---

*Built with ❤️ for the Camp Network community*
