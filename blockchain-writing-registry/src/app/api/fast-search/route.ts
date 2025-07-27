import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { base } from 'viem/chains';

// Contract ABI - only the functions we need for speed
const FAST_SEARCH_ABI = [
  {
    "inputs": [{"internalType": "string", "name": "hash", "type": "string"}],
    "name": "isHashRegistered",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "hash", "type": "string"}],
    "name": "getProof",
    "outputs": [{
      "components": [
        {"internalType": "string", "name": "title", "type": "string"},
        {"internalType": "string", "name": "license", "type": "string"},
        {"internalType": "string", "name": "twitterHandle", "type": "string"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
        {"internalType": "address", "name": "creator", "type": "address"}
      ],
      "internalType": "struct WritingRegistry.Proof",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const WRITING_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0xb9C7cd7158805B03A8ADc999F6C08933E51BD97d';
const CAMP_RPC_URL = process.env.CAMP_RPC_URL || 'https://mainnet.base.org';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');

    if (!hash) {
      return NextResponse.json({ error: 'Hash parameter required' }, { status: 400 });
    }

    // Validate hash format
    if (!hash.startsWith('0x') || hash.length !== 66) {
      return NextResponse.json({ error: 'Invalid hash format' }, { status: 400 });
    }

    // Create optimized client for speed
    const publicClient = createPublicClient({
      chain: {
        ...base,
        id: 123420001114,
        name: 'Camp Network BaseCAMP',
        network: 'camp-network',
        nativeCurrency: { name: 'CAMP', symbol: 'CAMP', decimals: 18 },
        rpcUrls: {
          default: { http: [CAMP_RPC_URL] },
          public: { http: [CAMP_RPC_URL] },
        },
      },
      transport: http(),
    });

    const contract = getContract({
      address: WRITING_REGISTRY_ADDRESS,
      abi: FAST_SEARCH_ABI,
      client: publicClient,
    });

    // Ultra-fast parallel queries
    const [isRegistered, proof] = await Promise.all([
      contract.read.isHashRegistered([hash]),
      contract.read.getProof([hash]).catch(() => null)
    ]);

    const searchTime = Date.now() - startTime;

    if (!isRegistered) {
      return NextResponse.json({
        found: false,
        searchTime: `${searchTime}ms`,
        message: 'Content not found on blockchain'
      });
    }

    return NextResponse.json({
      found: true,
      searchTime: `${searchTime}ms`,
      data: {
        hash: hash,
        title: proof?.title || 'Unknown',
        license: proof?.license || 'Unknown',
        twitterHandle: proof?.twitterHandle || '',
        timestamp: proof?.timestamp?.toString() || '0',
        creator: proof?.creator || '0x0000000000000000000000000000000000000000',
        registeredOnChain: true
      }
    });

  } catch (error) {
    console.error('Fast search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 