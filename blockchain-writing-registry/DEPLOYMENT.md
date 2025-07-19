# Deployment Guide

This guide covers deploying both the smart contract to Camp Network BaseCAMP and the frontend to Vercel.

## 🏗️ Smart Contract Deployment (Remix IDE)

### Prerequisites
- MetaMask or compatible wallet with Camp Network BaseCAMP configured
- CAMP tokens for gas fees
- Access to [Remix IDE](https://remix.ethereum.org/)

### Step 1: Configure Camp Network BaseCAMP in MetaMask

Add Camp Network BaseCAMP to your MetaMask:

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

### Step 2: Deploy via Remix IDE

1. **Open Remix IDE**
   - Go to [remix.ethereum.org](https://remix.ethereum.org/)
   - Create a new workspace or open existing

2. **Upload Contract**
   - Create a new file: `WritingRegistry.sol`
   - Copy the contract code from this repository
   - Save the file

3. **Compile Contract**
   - Go to the "Solidity Compiler" tab
   - Set compiler version to 0.8.20 or higher
   - Click "Compile WritingRegistry.sol"
   - Ensure compilation is successful

4. **Deploy Contract**
   - Go to the "Deploy & Run Transactions" tab
   - Set environment to "Injected Provider - MetaMask"
   - Ensure MetaMask is connected to Camp Network BaseCAMP
   - Click "Deploy"
   - Confirm transaction in MetaMask

5. **Verify Contract**
   - Copy the deployed contract address
   - Go to [BaseCAMP Explorer](https://basecamp.cloud.blockscout.com/)
   - Verify the contract with source code

### Step 3: Update Environment Variables

After deployment, update your `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Your deployed contract address
```

## 🌐 Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account
- Repository pushed to GitHub

### Step 1: Prepare Repository

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Environment Variables**
   Create `.env.local` with:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Your deployed contract address
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id # Optional
   ```

### Step 2: Deploy to Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

3. **Environment Variables**
   - Add `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - Add `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optional)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your dApp is now live!

### Step 3: Custom Domain (Optional)

1. **Add Domain**
   - Go to project settings in Vercel
   - Click "Domains"
   - Add your custom domain
   - Configure DNS records

2. **SSL Certificate**
   - Vercel automatically provisions SSL
   - No additional configuration needed

## 🔧 Configuration Details

### Smart Contract Configuration

The contract requires no constructor parameters and can be deployed directly.

**Gas Estimation**: ~500,000 gas units for deployment

**Contract Verification**:
- Compiler Version: 0.8.20
- Optimization: Enabled
- Runs: 200

### Frontend Configuration

**Build Settings**:
- Node.js Version: 18.x
- Build Command: `npm run build`
- Install Command: `npm install`

**Environment Variables**:
```env
# Required
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CAMP_NETWORK_RPC=https://rpc.basecamp.t.raas.gelato.cloud
NEXT_PUBLIC_CAMP_NETWORK_EXPLORER=https://basecamp.cloud.blockscout.com/
```

## 🧪 Testing Deployment

### Smart Contract Testing

1. **Test Registration**
   - Use Remix IDE to call `registerProof`
   - Verify event emission
   - Check `getProof` returns correct data

2. **Test Edge Cases**
   - Duplicate hash registration (should fail)
   - Invalid hash length (should fail)
   - Empty parameters (should fail)

### Frontend Testing

1. **Wallet Connection**
   - Test MetaMask connection
   - Test WalletConnect (if configured)
   - Verify network switching to Camp Network BaseCAMP

2. **Content Registration**
   - Submit test content
   - Verify hash generation
   - Check transaction confirmation on BaseCAMP Explorer

3. **Registry Search**
   - Search by valid hash
   - Search by invalid hash
   - Verify metadata display

## 🔍 Troubleshooting

### Common Issues

**Smart Contract**:
- Gas limit too low: Increase gas limit in MetaMask
- Wrong network: Ensure MetaMask is on Camp Network BaseCAMP
- Compilation errors: Check Solidity version compatibility

**Frontend**:
- Contract not found: Verify contract address in environment
- Wallet connection fails: Check network configuration
- Build errors: Ensure all dependencies are installed

### Debug Commands

```bash
# Check contract deployment
npx hardhat verify --network basecamp 0x... # If using Hardhat

# Test frontend locally
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## 📊 Monitoring

### Smart Contract Monitoring
- Monitor events on [BaseCAMP Explorer](https://basecamp.cloud.blockscout.com/)
- Track gas usage and transaction costs
- Monitor contract interactions

### Frontend Monitoring
- Vercel analytics and performance
- Error tracking and logging
- User interaction analytics

## 🔄 Updates and Maintenance

### Smart Contract Updates
- Deploy new contract version
- Update frontend contract address
- Migrate data if necessary

### Frontend Updates
- Push changes to GitHub
- Vercel automatically redeploys
- Test new features in staging

## 🌐 Camp Network BaseCAMP Resources

- **RPC Endpoints**:
  - Primary: `https://rpc.basecamp.t.raas.gelato.cloud`
  - Secondary: `https://rpc-campnetwork.xyz`
- **Block Explorer**: https://basecamp.cloud.blockscout.com/
- **Chain ID**: 123420001114
- **Currency**: CAMP

---

For additional support, refer to the main README or open an issue on GitHub. 