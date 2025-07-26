import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

// WritingRegistry contract ABI (just the events we need)
const WRITING_REGISTRY_ABI = [
  parseAbiItem('event ProofRegistered(string indexed hash, string title, string license, string twitterHandle, uint256 timestamp, address indexed creator)')
];

// CAMP Network IPNFT contract address (what Origin SDK uses)
const CAMP_IPNFT_ADDRESS = '0xF90733b9eCDa3b49C250B2C3E3E42c96fC93324E';

// WritingRegistry contract address (your custom contract)
const WRITING_REGISTRY_ADDRESS = '0xb9C7cd7158805B03A8ADc999F6C08933E51BD97d';

// Create viem client for Base
const client = createPublicClient({
  chain: base,
  transport: http()
});

// Function to fetch real data from CAMP IPNFT contract (what Origin SDK uses)
async function fetchRealData(searchType: string, searchValue: string) {
  try {
    console.log('🔍 Fetching real data from blockchain contracts...');
    console.log('🔍 Search type:', searchType, 'Search value:', searchValue);
    
    // Get the latest block number
    const latestBlock = await client.getBlockNumber();
    console.log('🔍 Latest block:', latestBlock);
    
    // Look at recent blocks for events
    const fromBlock = latestBlock - 10000n; // Last 10,000 blocks should be enough
    const toBlock = latestBlock;
    
    console.log('🔍 Fetching events from blocks', fromBlock, 'to', toBlock);
    
    // Check WritingRegistry contract for ProofRegistered events
    console.log('🔍 Checking WritingRegistry contract:', WRITING_REGISTRY_ADDRESS);
    
    const writingRegistryLogs = await client.getLogs({
      address: WRITING_REGISTRY_ADDRESS,
      event: parseAbiItem('event ProofRegistered(string indexed hash, string title, string license, string twitterHandle, uint256 timestamp, address indexed creator)'),
      fromBlock,
      toBlock,
    });
    
    console.log('🔍 Found', writingRegistryLogs.length, 'ProofRegistered events from WritingRegistry');
    
    // Transform WritingRegistry logs to the expected format
    const realData = writingRegistryLogs.map((log, index) => {
      const { hash, creator, title, license, twitterHandle, timestamp } = log.args;
      return {
        id: `registry-${index}`,
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
    
    console.log('🔍 Transformed real data from WritingRegistry:', realData);
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
  // Fetch real data from blockchain instead of returning sample data
  try {
    const realData = await fetchRealData('address', '0x0000000000000000000000000000000000000000');
    
    return NextResponse.json({
      success: true,
      data: realData,
      count: realData.length,
      message: realData.length > 0 ? 'Real blockchain data found' : 'No real data found on blockchain'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      message: 'Error fetching blockchain data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
    
    // If no real data found, return empty array (no sample data fallback)
    if (allData.length === 0) {
      console.log('🔍 No real data found on blockchain');
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        searchType,
        searchValue,
        dataSource: 'real-data',
        message: 'No content found on blockchain'
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