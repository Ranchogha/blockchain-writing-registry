import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { base } from 'viem/chains';

// Contract ABI for search functionality
const SEARCH_ABI = [
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
const CAMP_RPC_URL = process.env.NEXT_PUBLIC_CAMP_NETWORK_RPC || 'https://rpc.basecamp.t.raas.gelato.cloud';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');
    const query = searchParams.get('query');

    if (!hash && !query) {
      return NextResponse.json({ error: 'Hash or query parameter required' }, { status: 400 });
    }

    // Create client for blockchain queries
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
      abi: SEARCH_ABI,
      client: publicClient,
    });

    // If hash is provided, search by hash
    if (hash) {
      // Validate hash format
      if (!hash.startsWith('0x') || hash.length !== 66) {
        return NextResponse.json({ error: 'Invalid hash format' }, { status: 400 });
      }

      // Check if hash is registered and get proof
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

      // Use Twitter handle as creator if available
      const creator = proof?.twitterHandle || proof?.creator || 'Unknown';

      return NextResponse.json({
        found: true,
        searchTime: `${searchTime}ms`,
        data: {
          hash: hash,
          title: proof?.title || 'Unknown',
          license: proof?.license || 'Unknown',
          twitterHandle: proof?.twitterHandle || '',
          timestamp: proof?.timestamp?.toString() || '0',
          creator: creator,
          walletAddress: proof?.creator || '0x0000000000000000000000000000000000000000',
          registeredOnChain: true
        }
      });
    }

    // If query is provided, search by content (this would require additional logic)
    if (query) {
      // For now, return a message that query search is not implemented
      // In a full implementation, you might search through indexed content
      return NextResponse.json({
        found: false,
        message: 'Query search not implemented. Please use hash search instead.',
        searchTime: `${Date.now() - startTime}ms`
      });
    }

  } catch (error) {
    console.error('Search error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      rpcUrl: CAMP_RPC_URL,
      contractAddress: WRITING_REGISTRY_ADDRESS
    });
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 