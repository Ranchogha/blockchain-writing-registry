import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { base } from 'viem/chains';

// WritingRegistry ABI for reading data
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
  }
] as const;

// Contract address
const WRITING_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0xb9C7cd7158805B03A8ADc999F6C08933E51BD97d';

// Camp Network RPC URL (you may need to adjust this)
const CAMP_RPC_URL = process.env.CAMP_RPC_URL || 'https://rpc.campnetwork.xyz';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');

    if (!hash) {
      return NextResponse.json(
        { error: 'Hash parameter is required' },
        { status: 400 }
      );
    }

    // Validate hash format
    if (!hash.startsWith('0x') || hash.length !== 66) {
      return NextResponse.json(
        { error: 'Invalid hash format. Must be 66 characters starting with 0x' },
        { status: 400 }
      );
    }

    // Create public client for Camp Network
    const publicClient = createPublicClient({
      chain: {
        ...base,
        id: 123420001114,
        name: 'Camp Network BaseCAMP',
        rpcUrls: {
          default: { http: [CAMP_RPC_URL] },
          public: { http: [CAMP_RPC_URL] }
        }
      },
      transport: http()
    });

    // Get contract instance
    const contract = getContract({
      address: WRITING_REGISTRY_ADDRESS,
      abi: WRITING_REGISTRY_ABI,
      client: publicClient
    });

    // Check if hash is registered
    const isRegistered = await contract.read.isHashRegistered([hash]);

    let blockchainData = null;
    
    if (isRegistered) {
      try {
        // Get the proof data from blockchain
        const proof = await contract.read.getProof([hash]);
        blockchainData = {
          title: proof.title,
          license: proof.license,
          twitterHandle: proof.twitterHandle,
          timestamp: proof.timestamp.toString(),
          creator: proof.creator
        };
      } catch (error) {
        console.error('Error fetching proof data:', error);
        // Hash is registered but we couldn't fetch the proof data
        blockchainData = { error: 'Could not fetch proof data' };
      }
    }

    return NextResponse.json({
      hash,
      isRegistered,
      blockchainData
    });

  } catch (error) {
    console.error('Error verifying hash:', error);
    return NextResponse.json(
      { error: 'Failed to verify hash on blockchain' },
      { status: 500 }
    );
  }
} 