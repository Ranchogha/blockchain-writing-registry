import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

// WritingRegistry contract ABI (just the events we need)
const WRITING_REGISTRY_ABI = [
  parseAbiItem('event ProofRegistered(bytes32 indexed hash, address indexed creator, string title, string license, string twitterHandle, uint256 timestamp)')
];

// WritingRegistry contract address on Base
const WRITING_REGISTRY_ADDRESS = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';

// Create viem client for Base
const client = createPublicClient({
  chain: base,
  transport: http()
});

// Function to fetch real data from WritingRegistry contract
async function fetchRealData(searchType: string, searchValue: string) {
  try {
    console.log('🔍 Fetching real data from WritingRegistry contract...');
    
    // Get the latest block number
    const latestBlock = await client.getBlockNumber();
    console.log('🔍 Latest block:', latestBlock);
    
    // Get logs from the last 10000 blocks (adjust as needed)
    const fromBlock = latestBlock - 10000n;
    const toBlock = latestBlock;
    
    console.log('🔍 Fetching logs from blocks', fromBlock, 'to', toBlock);
    
    const logs = await client.getLogs({
      address: WRITING_REGISTRY_ADDRESS,
      event: WRITING_REGISTRY_ABI[0],
      fromBlock,
      toBlock,
    });
    
    console.log('🔍 Found', logs.length, 'ProofRegistered events');
    
    // Transform logs to the expected format
    const realData = logs.map((log, index) => {
      const { hash, creator, title, license, twitterHandle, timestamp } = log.args;
      return {
        id: `real-${index}`,
        hash: hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
        title: title || 'Untitled',
        license: license || 'All Rights Reserved',
        twitterHandle: twitterHandle || '',
        timestamp: timestamp ? Number(timestamp) : Math.floor(Date.now() / 1000),
        creator: creator || '0x0000000000000000000000000000000000000000',
        blockNumber: log.blockNumber?.toString() || '0',
        transactionHash: log.transactionHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
        metadata: {
          title: title || 'Untitled',
          license: license || 'All Rights Reserved',
          twitterHandle: twitterHandle || '',
          contentHash: hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
        }
      };
    });
    
    console.log('🔍 Transformed real data:', realData);
    return realData;
  } catch (error) {
    console.error('🔍 Error fetching real data:', error);
    return [];
  }
}

// GraphQL query for the subgraph
const SEARCH_PROOFS_QUERY = `
  query SearchProofs($searchType: String!, $searchValue: String!) {
    proofs(first: 100, orderBy: timestamp, orderDirection: desc) {
      id
      hash
      title
      license
      twitterHandle
      timestamp
      creator {
        id
        address
      }
      blockNumber
      transactionHash
    }
  }
`;

const SEARCH_PROOFS_BY_CREATOR_QUERY = `
  query SearchProofsByCreator($creatorAddress: String!) {
    creator(id: $creatorAddress) {
      id
      address
      proofCount
      proofs(first: 100, orderBy: timestamp, orderDirection: desc) {
        id
        hash
        title
        license
        twitterHandle
        timestamp
        blockNumber
        transactionHash
      }
    }
  }
`;

const SEARCH_PROOFS_BY_TWITTER_QUERY = `
  query SearchProofsByTwitter($twitterHandle: String!) {
    proofs(where: { twitterHandle: $twitterHandle }, first: 100, orderBy: timestamp, orderDirection: desc) {
      id
      hash
      title
      license
      twitterHandle
      timestamp
      creator {
        id
        address
      }
      blockNumber
      transactionHash
    }
  }
`;

const SEARCH_PROOFS_BY_HASH_QUERY = `
  query SearchProofsByHash($hash: String!) {
    proof(id: $hash) {
      id
      hash
      title
      license
      twitterHandle
      timestamp
      creator {
        id
        address
      }
      blockNumber
      transactionHash
    }
  }
`;

export async function GET() {
  // Simple test endpoint to verify the API is working
  const sampleData = [
    {
      id: 'test-1',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      title: 'Test Story',
      license: 'All Rights Reserved',
      twitterHandle: 'sampleuser',
      timestamp: Math.floor(Date.now() / 1000),
      creator: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      metadata: {
        title: 'Test Story',
        license: 'All Rights Reserved',
        twitterHandle: 'sampleuser',
        contentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      }
    }
  ];

  return NextResponse.json({
    success: true,
    data: sampleData,
    message: 'API is working - test data returned'
  });
}

export async function POST(request: NextRequest) {
  try {
    const { searchType, searchValue, dataSource } = await request.json();

    console.log('🔍 API Search Request:', { searchType, searchValue, dataSource });

    if (!searchType || !searchValue) {
      return NextResponse.json(
        { error: 'Search type and value are required' },
        { status: 400 }
      );
    }

    const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
    console.log('🔍 Subgraph URL:', subgraphUrl ? 'Configured' : 'Not configured');
    
    // Try to fetch real data from the WritingRegistry contract first
    let allData = await fetchRealData(searchType, searchValue);
    console.log('🔍 Real data fetched:', allData.length, 'items');
    
    // If no real data found, use sample data for testing
    if (allData.length === 0) {
      console.log('🔍 No real data found, using sample data for testing');
      
      const sampleData = [
        {
          id: 'sample-1',
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          title: 'Sample Story: The Beginning',
          license: 'All Rights Reserved',
          twitterHandle: 'sampleuser',
          timestamp: Math.floor(Date.now() / 1000) - 86400,
          creator: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          blockNumber: '13968554',
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          metadata: {
            title: 'Sample Story: The Beginning',
            license: 'All Rights Reserved',
            twitterHandle: 'sampleuser',
            contentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          }
        },
        {
          id: 'sample-2',
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          title: 'Another Sample: The Journey',
          license: 'Creative Commons',
          twitterHandle: 'testwriter',
          timestamp: Math.floor(Date.now() / 1000) - 172800,
          creator: '0xd486cF2e9960fC28D053ed61aD0157D491a672A7',
          blockNumber: '13968555',
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          metadata: {
            title: 'Another Sample: The Journey',
            license: 'Creative Commons',
            twitterHandle: 'testwriter',
            contentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          }
        },
        {
          id: 'sample-3',
          hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          title: 'Third Sample: The Adventure',
          license: 'MIT',
          twitterHandle: 'adventurer',
          timestamp: Math.floor(Date.now() / 1000) - 259200,
          creator: '0x1234567890123456789012345678901234567890',
          blockNumber: '13968556',
          transactionHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          metadata: {
            title: 'Third Sample: The Adventure',
            license: 'MIT',
            twitterHandle: 'adventurer',
            contentHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          }
        },
        {
          id: 'sample-4',
          hash: '0x5555555555555555555555555555555555555555555555555555555555555555',
          title: 'Fourth Sample: The Mystery',
          license: 'GPL',
          twitterHandle: 'mysterywriter',
          timestamp: Math.floor(Date.now() / 1000) - 345600,
          creator: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          blockNumber: '13968557',
          transactionHash: '0x5555555555555555555555555555555555555555555555555555555555555555',
          metadata: {
            title: 'Fourth Sample: The Mystery',
            license: 'GPL',
            twitterHandle: 'mysterywriter',
            contentHash: '0x5555555555555555555555555555555555555555555555555555555555555555',
          }
        }
      ];

      console.log('🔍 Sample data available:', sampleData.length, 'items');

      // Filter sample data based on search criteria
      let filteredData = sampleData;
      
      if (searchType === 'address') {
        const searchAddress = searchValue.toLowerCase();
        console.log('🔍 Filtering by address:', searchAddress);
        filteredData = sampleData.filter(item => 
          item.creator.toLowerCase() === searchAddress
        );
      } else if (searchType === 'twitter') {
        const handle = searchValue.replace('@', '').toLowerCase();
        console.log('🔍 Filtering by Twitter handle:', handle);
        filteredData = sampleData.filter(item => 
          item.twitterHandle.toLowerCase() === handle
        );
      } else if (searchType === 'hash') {
        const searchHash = searchValue.toLowerCase();
        console.log('🔍 Filtering by hash:', searchHash);
        filteredData = sampleData.filter(item => 
          item.hash.toLowerCase() === searchHash
        );
      }

      console.log('🔍 Filtered data count:', filteredData.length);

      return NextResponse.json({
        success: true,
        data: filteredData,
        count: filteredData.length,
        searchType,
        searchValue,
        dataSource: 'sample-data'
      });
    }

    // Filter real data based on search criteria
    let filteredData = allData;
    
    if (searchType === 'address') {
      const searchAddress = searchValue.toLowerCase();
      console.log('🔍 Filtering real data by address:', searchAddress);
      filteredData = allData.filter(item => 
        item.creator.toLowerCase() === searchAddress
      );
    } else if (searchType === 'twitter') {
      const handle = searchValue.replace('@', '').toLowerCase();
      console.log('🔍 Filtering real data by Twitter handle:', handle);
      filteredData = allData.filter(item => 
        item.twitterHandle.toLowerCase() === handle
      );
    } else if (searchType === 'hash') {
      const searchHash = searchValue.toLowerCase();
      console.log('🔍 Filtering real data by hash:', searchHash);
      filteredData = allData.filter(item => 
        item.hash.toLowerCase() === searchHash
      );
    }

    console.log('🔍 Filtered real data count:', filteredData.length);

    return NextResponse.json({
      success: true,
      data: filteredData,
      count: filteredData.length,
      searchType,
      searchValue,
      dataSource: 'real-data'
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 