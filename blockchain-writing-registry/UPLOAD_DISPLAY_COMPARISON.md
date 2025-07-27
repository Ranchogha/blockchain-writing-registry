# Upload vs Display Method Comparison

## Overview

This document compares the uploading method (content submission) with the display method (registry viewer) to show how they work together to provide a complete content registration and verification system.

## Upload Method (Content Submission)

### 1. Content Processing
```typescript
// Generate SHA-256 hash from content
const generateHash = (text: string) => {
  if (!text.trim()) return '';
  const hash = CryptoJS.SHA256(text).toString();
  return `0x${hash}`;
};
```

### 2. Origin SDK Integration
```typescript
// Upload content to IPFS via Origin SDK
const fileToMint = new File([content], `${title}.txt`, { type: 'text/plain' });
const tx = await origin.mintFile(
  fileToMint,
  meta, // Metadata including title, license, contentHash, etc.
  licence
);
```

### 3. Metadata Structure
```typescript
const meta = {
  title,
  license,
  contentHash,
  content,
  twitter: twitterData,
  twitterHandle,
};
```

### 4. Smart Contract Registration
The content is registered on the `WritingRegistry` smart contract with:
- Content hash (SHA-256)
- Title
- License
- Twitter handle
- Timestamp
- Creator address

## Display Method (Registry Viewer)

### 1. Content Retrieval
```typescript
// Fetch uploaded content from Origin SDK
const uploads = await origin.getOriginUploads();

// Fetch actual content from IPFS URLs
const response = await fetch(upload.url);
const content = await response.text();
```

### 2. Hash Verification
```typescript
// Generate hash using the same method as upload
const contentHash = generateHash(content);

// Verify against blockchain
const verification = await verifyContent(content, contentHash);
```

### 3. Blockchain Verification
```typescript
// Check if hash is registered on blockchain
const isRegistered = await contract.read.isHashRegistered([hash]);

// Get proof data from blockchain
const proof = await contract.read.getProof([hash]);
```

### 4. Data Enrichment
The display method enriches Origin SDK data with:
- Actual content from IPFS
- Generated hash verification
- Blockchain registration status
- Smart contract proof data

## Key Improvements Made

### 1. Hash Consistency
Both methods now use the same `CryptoJS.SHA256()` function to generate hashes, ensuring consistency between upload and display.

### 2. Blockchain Verification
Added verification against the smart contract to confirm:
- Content hash is registered on blockchain
- Metadata matches between IPFS and blockchain
- Creator address verification

### 3. Enhanced Metadata Processing
Improved parsing of content to extract:
- Title from content or metadata
- Twitter handle from content or metadata
- License information
- Timestamp and creator details

### 4. Visual Verification Indicators
Added status indicators showing:
- ✅ Hash match (content integrity)
- ✅ Blockchain registration
- ⚠️ Content not found on blockchain
- ❌ Hash mismatch

## Data Flow Comparison

### Upload Flow:
1. User enters content → Generate hash → Upload to IPFS → Register on blockchain
2. Content stored in IPFS with metadata
3. Hash and metadata stored in smart contract

### Display Flow:
1. Fetch content from Origin SDK → Get IPFS URLs → Download content
2. Generate hash from downloaded content → Compare with stored hash
3. Query blockchain → Verify registration and metadata
4. Display enriched data with verification status

## Smart Contract Integration

### WritingRegistry Contract Methods Used:

#### For Uploading:
- `registerProof(hash, title, license, twitterHandle)` - Registers content on blockchain

#### For Displaying:
- `isHashRegistered(hash)` - Checks if content is registered
- `getProof(hash)` - Retrieves proof data from blockchain

### Contract Structure:
```solidity
struct Proof {
    string title;
    string license;
    string twitterHandle;
    uint256 timestamp;
    address creator;
}
```

## Verification Process

### 1. Content Integrity Check
```typescript
const actualHash = generateHash(content);
const isHashMatch = actualHash.toLowerCase() === expectedHash.toLowerCase();
```

### 2. Blockchain Registration Check
```typescript
const isRegistered = await contract.read.isHashRegistered([hash]);
```

### 3. Metadata Comparison
```typescript
const blockchainData = await contract.read.getProof([hash]);
// Compare blockchain data with IPFS metadata
```

## Benefits of This Approach

### 1. **Data Integrity**: Content hash verification ensures content hasn't been tampered with
### 2. **Blockchain Verification**: Confirms content is actually registered on the blockchain
### 3. **Metadata Consistency**: Compares metadata between IPFS and blockchain
### 4. **User Trust**: Visual indicators show verification status
### 5. **Decentralized Storage**: Content stored on IPFS, proof on blockchain

## Usage Examples

### Searching by Wallet Address:
- Shows all content registered by that address
- Verifies each piece of content against blockchain
- Displays verification status for each item

### Searching by Twitter Handle:
- Shows content with specific Twitter handle
- Verifies creator address matches
- Ensures content authenticity

### Searching by Content Hash:
- Exact match for specific content
- Full verification against blockchain
- Complete metadata comparison

## Technical Implementation

### API Endpoint for Verification:
```typescript
// /api/verify-hash?hash=0x...
export async function GET(request: NextRequest) {
  // Query blockchain for hash registration
  // Return verification status and blockchain data
}
```

### Enhanced UI Components:
- Verification status indicators
- Blockchain data display
- Content hash copying functionality
- Debug information for troubleshooting

This comparison shows how the upload and display methods work together to create a robust, verifiable content registration system that leverages both IPFS for content storage and blockchain for proof verification. 