import { NextRequest, NextResponse } from 'next/server';

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
    
    if (!subgraphUrl) {
      // Return sample data for testing when subgraph is not configured
      console.log('🔍 Using sample data for testing');
      
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
          creator: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          blockNumber: '13968555',
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          metadata: {
            title: 'Another Sample: The Journey',
            license: 'Creative Commons',
            twitterHandle: 'testwriter',
            contentHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
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

    let query = '';
    let variables = {};

    switch (searchType) {
      case 'address':
        query = SEARCH_PROOFS_BY_CREATOR_QUERY;
        variables = { creatorAddress: searchValue.toLowerCase() };
        break;
      case 'twitter':
        query = SEARCH_PROOFS_BY_TWITTER_QUERY;
        variables = { twitterHandle: searchValue.replace('@', '') };
        break;
      case 'hash':
        query = SEARCH_PROOFS_BY_HASH_QUERY;
        variables = { hash: searchValue };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid search type' },
          { status: 400 }
        );
    }

    // Fetch data from subgraph
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: 'GraphQL query failed', details: data.errors },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    let results = [];
    
    if (searchType === 'address') {
      // Handle creator search
      const creator = data.data?.creator;
      if (creator && creator.proofs) {
        results = creator.proofs.map((proof: any) => ({
          id: proof.id,
          hash: proof.hash,
          title: proof.title,
          license: proof.license,
          twitterHandle: proof.twitterHandle,
          timestamp: proof.timestamp,
          creator: proof.creator?.address || creator.address,
          blockNumber: proof.blockNumber,
          transactionHash: proof.transactionHash,
          metadata: {
            title: proof.title,
            license: proof.license,
            twitterHandle: proof.twitterHandle,
            contentHash: proof.hash,
          }
        }));
      }
    } else if (searchType === 'hash') {
      // Handle hash search
      const proof = data.data?.proof;
      if (proof) {
        results = [{
          id: proof.id,
          hash: proof.hash,
          title: proof.title,
          license: proof.license,
          twitterHandle: proof.twitterHandle,
          timestamp: proof.timestamp,
          creator: proof.creator?.address,
          blockNumber: proof.blockNumber,
          transactionHash: proof.transactionHash,
          metadata: {
            title: proof.title,
            license: proof.license,
            twitterHandle: proof.twitterHandle,
            contentHash: proof.hash,
          }
        }];
      }
    } else if (searchType === 'twitter') {
      // Handle Twitter search
      const proofs = data.data?.proofs || [];
      results = proofs.map((proof: any) => ({
        id: proof.id,
        hash: proof.hash,
        title: proof.title,
        license: proof.license,
        twitterHandle: proof.twitterHandle,
        timestamp: proof.timestamp,
        creator: proof.creator?.address,
        blockNumber: proof.blockNumber,
        transactionHash: proof.transactionHash,
        metadata: {
          title: proof.title,
          license: proof.license,
          twitterHandle: proof.twitterHandle,
          contentHash: proof.hash,
        }
      }));
    }

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      searchType,
      searchValue,
      dataSource: 'subgraph'
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 