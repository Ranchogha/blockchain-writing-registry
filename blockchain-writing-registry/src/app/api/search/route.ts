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

// Multiple RPC endpoints for better reliability
const RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_CAMP_NETWORK_RPC || 'https://rpc.basecamp.t.raas.gelato.cloud',
  'https://rpc-campnetwork.xyz',
  'https://rpc.basecamp.t.raas.gelato.cloud'
];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');
    const query = searchParams.get('query');
    const test = searchParams.get('test');

    // Test endpoint to check contract state
    if (test === 'true') {
      console.log('🧪 Test endpoint called');
      console.log('🧪 Contract address:', WRITING_REGISTRY_ADDRESS);
      console.log('🧪 RPC endpoints:', RPC_ENDPOINTS);
      
      try {
        const publicClient = createPublicClient({
          chain: {
            ...base,
            id: 123420001114,
            name: 'Camp Network BaseCAMP',
            network: 'camp-network',
            nativeCurrency: { name: 'CAMP', symbol: 'CAMP', decimals: 18 },
            rpcUrls: {
              default: { http: [RPC_ENDPOINTS[0]] },
              public: { http: [RPC_ENDPOINTS[0]] },
            },
          },
          transport: http(),
        });

        const contract = getContract({
          address: WRITING_REGISTRY_ADDRESS,
          abi: SEARCH_ABI,
          client: publicClient,
        });

        // Test with a known working hash
        const testHash = '0x498137c6c887570dedd2ded690fbc4febcae24b8f7beffe034303c0c5ba010af';
        console.log('🧪 Testing with known hash:', testHash);
        
        const [isRegistered, proof] = await Promise.all([
          contract.read.isHashRegistered([testHash]),
          contract.read.getProof([testHash]).catch((e) => {
            console.log('🧪 getProof error:', e);
            return null;
          })
        ]);

        return NextResponse.json({
          test: true,
          contractAddress: WRITING_REGISTRY_ADDRESS,
          rpcEndpoint: RPC_ENDPOINTS[0],
          testHash,
          isRegistered,
          proof,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return NextResponse.json({
          test: true,
          error: error instanceof Error ? error.message : 'Unknown error',
          contractAddress: WRITING_REGISTRY_ADDRESS,
          rpcEndpoints: RPC_ENDPOINTS,
          timestamp: new Date().toISOString()
        });
      }
    }

    if (!hash && !query) {
      return NextResponse.json({ error: 'Hash or query parameter required' }, { status: 400 });
    }

    // If hash is provided, search by hash
    if (hash) {
      // Validate hash format
      if (!hash.startsWith('0x') || hash.length !== 66) {
        return NextResponse.json({ error: 'Invalid hash format' }, { status: 400 });
      }

      console.log(`🔍 Searching for hash: ${hash}`);
      console.log(`🔍 Contract address: ${WRITING_REGISTRY_ADDRESS}`);

      // Try multiple RPC endpoints
      let lastError = null;
      
      for (const rpcUrl of RPC_ENDPOINTS) {
        try {
          console.log(`🔍 Trying RPC endpoint: ${rpcUrl}`);
          
          // Create client for blockchain queries
          const publicClient = createPublicClient({
            chain: {
              ...base,
              id: 123420001114,
              name: 'Camp Network BaseCAMP',
              network: 'camp-network',
              nativeCurrency: { name: 'CAMP', symbol: 'CAMP', decimals: 18 },
              rpcUrls: {
                default: { http: [rpcUrl] },
                public: { http: [rpcUrl] },
              },
            },
            transport: http(),
          });

          const contract = getContract({
            address: WRITING_REGISTRY_ADDRESS,
            abi: SEARCH_ABI,
            client: publicClient,
          });

          // Check if hash is registered and get proof
          console.log(`🔍 Checking if hash is registered...`);
          const [isRegistered, proof] = await Promise.all([
            contract.read.isHashRegistered([hash]),
            contract.read.getProof([hash]).catch((e) => {
              console.log(`🔍 getProof error:`, e);
              return null;
            })
          ]);

          const searchTime = Date.now() - startTime;
          console.log(`🔍 Search completed in ${searchTime}ms`);
          console.log(`🔍 Is registered: ${isRegistered}`);
          console.log(`🔍 Proof:`, proof);

          if (!isRegistered) {
            console.log(`🔍 Hash not found on blockchain via ${rpcUrl}`);
            lastError = new Error(`Hash not found via ${rpcUrl}`);
            continue; // Try next RPC endpoint
          }

          // Use Twitter handle as creator if available
          const creator = proof?.twitterHandle || proof?.creator || 'Unknown';

          return NextResponse.json({
            found: true,
            searchTime: `${searchTime}ms`,
            rpcEndpoint: rpcUrl,
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

        } catch (error) {
          console.error(`❌ Error with RPC endpoint ${rpcUrl}:`, error);
          lastError = error;
          continue; // Try next RPC endpoint
        }
      }

      // If we get here, all RPC endpoints failed
      const searchTime = Date.now() - startTime;
      console.error(`❌ All RPC endpoints failed for hash: ${hash}`);
      
      return NextResponse.json({
        found: false,
        searchTime: `${searchTime}ms`,
        message: 'Content not found on blockchain - tried multiple RPC endpoints',
        error: lastError instanceof Error ? lastError.message : 'Unknown error',
        debug: {
          hash,
          contractAddress: WRITING_REGISTRY_ADDRESS,
          rpcEndpoints: RPC_ENDPOINTS
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
      rpcEndpoints: RPC_ENDPOINTS,
      contractAddress: WRITING_REGISTRY_ADDRESS
    });
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 