import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { base } from 'viem/chains';

// Contract ABI for the WritingRegistry
const WRITING_REGISTRY_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      }
    ],
    "name": "getProof",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "license",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "twitterHandle",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          }
        ],
        "internalType": "struct WritingRegistry.Proof",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      }
    ],
    "name": "isHashRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "getContentByCreator",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address
const WRITING_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0xb9C7cd7158805B03A8ADc999F6C08933E51BD97d';

// Camp Network RPC URL
const CAMP_RPC_URL = process.env.CAMP_RPC_URL || 'https://mainnet.base.org';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    // Create public client for Camp Network
    const publicClient = createPublicClient({
      chain: {
        ...base,
        id: 123420001114, // Camp Network chain ID
        name: 'Camp Network BaseCAMP',
        network: 'camp-network',
        nativeCurrency: {
          name: 'CAMP',
          symbol: 'CAMP',
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: [CAMP_RPC_URL],
          },
          public: {
            http: [CAMP_RPC_URL],
          },
        },
      },
      transport: http(),
    });

    const contract = getContract({
      address: WRITING_REGISTRY_ADDRESS,
      abi: WRITING_REGISTRY_ABI,
      client: publicClient,
    });

    // Try to get content hashes for the address
    let contentHashes: string[] = [];
    
    try {
      // Check if the contract has a getContentByCreator function
      contentHashes = await contract.read.getContentByCreator([address as `0x${string}`]);
    } catch (error) {
      console.log('getContentByCreator not available, falling back to event logs');
      
      // Fallback: Get all registration events for this address
      // This would require indexing events, which is more complex
      // For now, we'll return an empty array and suggest using Origin SDK
      return NextResponse.json({
        contentHashes: [],
        message: 'Direct blockchain query not available. Please use Origin SDK with connected wallet.',
        address: address,
        totalContent: 0
      });
    }

    // Get detailed information for each content hash
    const contentDetails = await Promise.all(
      contentHashes.map(async (hash) => {
        try {
          const proof = await contract.read.getProof([hash]);
          return {
            hash: hash,
            title: proof.title,
            license: proof.license,
            twitterHandle: proof.twitterHandle,
            timestamp: proof.timestamp.toString(),
            creator: proof.creator,
          };
        } catch (error) {
          console.error(`Error getting proof for hash ${hash}:`, error);
          return {
            hash: hash,
            title: 'Unknown',
            license: 'Unknown',
            twitterHandle: '',
            timestamp: '0',
            creator: address,
          };
        }
      })
    );

    return NextResponse.json({
      contentHashes: contentHashes,
      contentDetails: contentDetails,
      address: address,
      totalContent: contentHashes.length
    });

  } catch (error) {
    console.error('Error in get-address-content API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content for address' },
      { status: 500 }
    );
  }
} 