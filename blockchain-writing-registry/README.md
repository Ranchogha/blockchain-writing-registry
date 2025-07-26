# ✍️ Blockchain-Based Writing Registry (Origin SDK Edition)

> Protect your words. Prove your authorship. Powered by blockchain and the Origin SDK.
> 
> **Latest Update**: Registry viewer search functionality fixed and deployed successfully.

A decentralized application (dApp) that allows writers and content creators to register proof of authorship for written works on-chain by submitting cryptographic hashes of their content. Built for the Camp Network (BaseCAMP), this platform leverages the [Origin SDK](https://docs.campnetwork.xyz/origin-v1/origin-sdk) for seamless NFT minting, authentication, and social (Twitter) integration.

---

## 🚀 Features

- ✅ Register a written work as a cryptographic hash (SHA-256)
- 🧾 Attach metadata (title, license type, optional Twitter handle, and Twitter data)
- ⛓️ Store and verify on-chain proof of ownership on Camp Network BaseCAMP
- 🔍 View public registry of previously submitted works
- 🛡️ Prevent duplicate registrations
- 🧠 Future-ready for plagiarism checks, AI attribution, and agent-based licensing
- 💼 Wallet & social login via Origin SDK (CampProvider, CampModal)
- 📱 Responsive design with modern UI
- 🔄 Real-time transaction status
- 📊 Transparent event emission for provenance

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Blockchain** | Camp Network BaseCAMP (EVM L1) | Decentralized storage and verification |
| **NFT Minting** | [Origin SDK](https://docs.campnetwork.xyz/origin-v1/origin-sdk) | NFT minting, authentication, social APIs |
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

### Powered by the Origin SDK
- **Authentication**: CampProvider and CampModal handle wallet and social login (Twitter, etc.)
- **NFT Minting**: Uses `origin.mintFile` from the Origin SDK to mint IP NFTs with writing content and Twitter data in the metadata.
- **Twitter Integration**: Uses the Origin SDK's TwitterAPI to fetch and store Twitter data for linked accounts.
- **Registry**: Uses `origin.getOriginUploads()` to fetch and display NFTs, with filtering by content hash or owner address.

### Main Components
- **ContentSubmission**: Form for registering new content and minting as an NFT
- **RegistryViewer**: Search and display registered NFTs by hash or by owner
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
   cp .env.example .env.local
   # Add your Origin Client ID and API URLs
   ```
   Example .env.local:
   ```env
   VITE_ORIGIN_API=https://api.origin.campnetwork.xyz
   VITE_ORIGIN_CLIENT_ID=your-origin-client-id
   NEXT_PUBLIC_SUBGRAPH_URL=https://api.goldsky.com/api/public/project_cmdhxq7767k6a01umch9m1nq0/subgraphs/blockchain-writing-strategy/1.0.0/gn
   ```

4. **Run development server**
   ```