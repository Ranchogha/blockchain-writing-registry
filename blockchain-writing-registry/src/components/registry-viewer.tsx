'use client'

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@campnetwork/origin/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Hash, Calendar, User, FileText, Database, Zap, Copy } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain, useContractReads } from 'wagmi';
import { toast } from 'react-hot-toast';
import CryptoJS from 'crypto-js';

// Simple debounce function for performance
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

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

// Camp Network chainId
const CAMP_CHAIN_ID = 123420001114;

export function RegistryViewer() {
  const { origin } = useAuth();
  const [input, setInput] = useState('');
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState<'hash'>('hash');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [verificationResults, setVerificationResults] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showTestContent, setShowTestContent] = useState(false);
  
  // Performance optimization: Memoize the search hash
  const searchHash = useMemo(() => input.trim().toLowerCase(), [input]);
  
  // Enhanced blockchain search using the search API
  const fastSearch = useCallback(async (hash: string) => {
    if (!hash || hash.length !== 66) return;
    
    setIsLoading(true);
    setError('');
    setNfts([]);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`/api/search?hash=${hash}`);
      const data = await response.json();
      const searchTime = Date.now() - startTime;
      
      console.log(`🔍 Enhanced search completed in ${searchTime}ms`);
      
      if (data.found) {
        // Create a standardized result format with Twitter handle as creator
        const result = {
          id: data.data.hash,
          hash: data.data.hash,
          metadata: {
            title: data.data.title,
            contentHash: data.data.hash,
            license: data.data.license,
            twitterHandle: data.data.twitterHandle,
            creator: data.data.creator, // This will be the Twitter handle if available
            owner: data.data.creator,
            walletAddress: data.data.walletAddress,
          },
          creator: data.data.creator, // Twitter handle as creator
          owner: data.data.creator,
          walletAddress: data.data.walletAddress,
          timestamp: data.data.timestamp,
          verification: {
            isHashMatch: true,
            isRegisteredOnChain: true,
            blockchainData: data.data,
            searchTime: data.searchTime
          }
        };
        
        setNfts([result]);
        console.log('🔍 Enhanced search result:', result);
      } else {
        setError(`No content found for hash: ${hash}. This content may not be registered.`);
      }
    } catch (error) {
      console.error('❌ Enhanced search error:', error);
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ultra-fast blockchain search with debouncing
  const debouncedSearch = useCallback(
    debounce(async (hash: string) => {
      await fastSearch(hash);
    }, 200), // Reduced to 200ms for even faster response
    [fastSearch]
  );

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Content hash copied to clipboard!');
  };

  // Generate hash using the same method as the upload component
  const generateHash = (content: string) => {
    if (!content.trim()) return '';
    const hash = CryptoJS.SHA256(content).toString();
    return `0x${hash}`;
  };

  // Verify content against blockchain data
  const verifyContent = async (content: string, expectedHash: string) => {
    const actualHash = generateHash(content);
    const isHashMatch = actualHash.toLowerCase() === expectedHash.toLowerCase();
    
    // Check if hash is registered on blockchain
    let isRegisteredOnChain = false;
    let blockchainData = null;
    let verificationError = null;
    
    try {
      const response = await fetch(`/api/verify-hash?hash=${expectedHash}`);
      if (response.ok) {
        const data = await response.json();
        isRegisteredOnChain = data.isRegistered;
        blockchainData = data.blockchainData;
      } else {
        verificationError = `API error: ${response.status}`;
      }
    } catch (error) {
      console.error('Error verifying hash on blockchain:', error);
      verificationError = 'Network error during verification';
    }

    return {
      isHashMatch,
      isRegisteredOnChain,
      actualHash,
      expectedHash,
      blockchainData,
      verificationError
    };
  };

  const handleSearch = async () => {
    if (!input.trim()) {
      toast.error('Please enter a search term.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setNfts([]);
    setDebugInfo(null);
    setVerificationResults([]);

    try {
      console.log('🔍 Starting search for:', input.trim());
      console.log('🔍 Search type:', searchType);

      // For hash searches, check both WritingRegistry contract AND Origin SDK
      if (searchType === 'hash' && input.trim().startsWith('0x') && input.trim().length === 66) {
        console.log('🔍 Using WritingRegistry contract + Origin SDK search for hash:', input.trim());
        
        let blockchainData = null;
        let originData = null;
        
        // Check WritingRegistry contract first
        try {
          const startTime = Date.now();
          const response = await fetch(`/api/search?hash=${input.trim()}`);
          const data = await response.json();
          const searchTime = Date.now() - startTime;
          
          console.log(`🔍 WritingRegistry search completed in ${searchTime}ms`);
          
          if (data.found) {
            blockchainData = data.data;
            console.log('🔍 Found on blockchain:', blockchainData);
          } else {
            console.log('🔍 Not found on blockchain');
          }
        } catch (error) {
          console.error('❌ WritingRegistry search error:', error);
          // Continue with Origin SDK even if blockchain search fails
        }
        
        // Check Origin SDK
        if (origin) {
          try {
            console.log('🔍 Checking Origin SDK for content...');
            const uploads = await origin.getOriginUploads();
            
            if (uploads && uploads.length > 0) {
              // Find matching content in Origin SDK
              for (const upload of uploads) {
                try {
                  const response = await fetch(upload.url);
                  if (response.ok) {
                    const content = await response.text();
                    const contentHash = generateHash(content);
                    
                    if (contentHash.toLowerCase() === input.trim().toLowerCase()) {
                      console.log('🔍 Found matching content in Origin SDK:', upload);
                      
                      // Parse metadata from content
                      let title = upload.title || upload.metadata?.title || 'Untitled';
                      let twitterHandle = upload.twitterHandle || upload.metadata?.twitterHandle || '';
                      
                      const lines = content.split(/\r?\n/);
                      for (let line of lines) {
                        const trimmed = line.trim();
                        if (!twitterHandle) {
                          const match = trimmed.match(/(?:Twitter:)?\s*(@[\w_]+)/i);
                          if (match) twitterHandle = match[1];
                        }
                        if (title === 'Untitled' && trimmed) {
                          const titleMatch = trimmed.match(/^Title:\s*(.+)$/i);
                          if (titleMatch) {
                            title = titleMatch[1];
                            continue;
                          }
                          title = trimmed;
                        }
                        if (title !== 'Untitled' && twitterHandle) break;
                      }
                      
                      const walletAddress = upload.owner || upload.creator || upload.metadata?.owner || upload.metadata?.creator || upload.metadata?.walletAddress || 'Unknown';
                      const creator = twitterHandle || walletAddress;
                      
                      originData = {
                        content: content,
                        title: title,
                        twitterHandle: twitterHandle,
                        creator: creator,
                        walletAddress: walletAddress,
                        license: upload.license || upload.metadata?.license || 'All Rights Reserved',
                        timestamp: upload.timestamp || upload.createdAt || Math.floor(Date.now() / 1000),
                        url: upload.url
                      };
                      break;
                    }
                  }
                } catch (e) {
                  console.error('🔍 Error fetching content from Origin SDK:', e);
                }
              }
            }
          } catch (e) {
            console.error('❌ Origin SDK search error:', e);
          }
        }
        
        // Combine results from both sources
        if (blockchainData || originData) {
          const result = {
            id: input.trim(),
            hash: input.trim(),
            metadata: {
              title: originData?.title || blockchainData?.title || 'Unknown',
              contentHash: input.trim(),
              license: originData?.license || blockchainData?.license || 'Unknown',
              twitterHandle: originData?.twitterHandle || blockchainData?.twitterHandle || '',
              creator: originData?.creator || blockchainData?.creator || 'Unknown',
              owner: originData?.creator || blockchainData?.creator || 'Unknown',
              walletAddress: originData?.walletAddress || blockchainData?.walletAddress || 'Unknown',
              content: originData?.content || null,
            },
            creator: originData?.creator || blockchainData?.creator || 'Unknown',
            owner: originData?.creator || blockchainData?.creator || 'Unknown',
            walletAddress: originData?.walletAddress || blockchainData?.walletAddress || 'Unknown',
            timestamp: originData?.timestamp || blockchainData?.timestamp || '0',
            verification: {
              isHashMatch: true,
              isRegisteredOnChain: !!blockchainData,
              blockchainData: blockchainData,
              originData: originData,
              searchTime: 'Combined search'
            }
          };
          
          setNfts([result]);
          console.log('🔍 Combined result:', result);
          return;
        } else {
          setError(`No content found for hash: ${input.trim()}. This content may not be registered on blockchain or Origin SDK.`);
          return;
        }
      }

      // For non-hash searches, use Origin SDK
      console.log('🔍 Using Origin SDK to fetch uploads...');
      
      if (!origin) {
        throw new Error('Origin SDK not available. Please connect your wallet.');
      }

      console.log('🔍 Starting Origin SDK search for registered content...');
      console.log('🔍 Search input:', input);
      console.log('🔍 Search type:', searchType);
      console.log('🔍 Origin object:', origin);
      console.log('🔍 Available origin methods:', Object.getOwnPropertyNames(origin));
      
      // Use only the valid Origin SDK method
      let uploads = [];
      
      try {
        uploads = await origin.getOriginUploads();
        console.log('🔍 getOriginUploads result:', uploads);
      } catch (e: any) {
        console.log('🔍 getOriginUploads failed:', e);
        setError(`Failed to fetch content: ${e.message || 'Unknown error'}`);
        return;
      }
      
      console.log('🔍 Final uploads to process:', uploads);
      console.log('🔍 Uploads length:', uploads?.length || 0);
      
      if (uploads && uploads.length > 0) {
        console.log('🔍 First upload structure:', uploads[0]);
        console.log('🔍 Upload keys:', Object.keys(uploads[0] || {}));
      }

      if (!uploads || uploads.length === 0) {
        console.log('🔍 No uploads found');
        setError('No content found. Please register content first.');
        return;
      }

      // Fetch full content and metadata for each upload
      let enrichedUploads = [];
      let verificationResults = [];
      console.log('🔍 Starting to fetch content for', uploads.length, 'uploads');
      
      for (let i = 0; i < uploads.length; i++) {
        const upload = uploads[i];
        console.log(`🔍 Processing upload ${i + 1}/${uploads.length}:`, upload);

        try {
          console.log('🔍 Fetching content from URL:', upload.url);
          const response = await fetch(upload.url);
          console.log('🔍 Response status:', response.status, response.statusText);

          if (response.ok) {
            const content = await response.text();
            console.log('🔍 Fetched content length:', content.length);
            console.log('🔍 Content preview:', content.substring(0, 100) + '...');

            // Generate hash using the same method as upload
            const contentHash = generateHash(content);
            console.log('🔍 Generated hash:', contentHash);

            // Parse title (first non-empty line or line starting with Title:)
            let title = upload.title || upload.metadata?.title || 'Untitled';
            let twitterHandle = upload.twitterHandle || upload.metadata?.twitterHandle || '';
            
            // Only parse from content if title is still 'Untitled' or no Twitter handle found
            if (title === 'Untitled' || !twitterHandle) {
              const lines = content.split(/\r?\n/);
              for (let line of lines) {
                const trimmed = line.trim();
                if (!twitterHandle) {
                  // Look for Twitter: @handle or @handle
                  const match = trimmed.match(/(?:Twitter:)?\s*(@[\w_]+)/i);
                  if (match) twitterHandle = match[1];
                }
                if (title === 'Untitled' && trimmed) {
                  // Prefer a line like Title: ...
                  const titleMatch = trimmed.match(/^Title:\s*(.+)$/i);
                  if (titleMatch) {
                    title = titleMatch[1];
                    continue;
                  }
                  // Otherwise, use the first non-empty line
                  title = trimmed;
                }
                if (title !== 'Untitled' && twitterHandle) break;
              }
            }

            // Use Twitter handle as creator if available, otherwise use wallet address
            const walletAddress = upload.owner || upload.creator || upload.metadata?.owner || upload.metadata?.creator || upload.metadata?.walletAddress || 'Unknown';
            const creator = twitterHandle || walletAddress;

            // Verify content against blockchain
            const verification = await verifyContent(content, contentHash);

            // Create enriched upload with metadata
            const enrichedUpload = {
              ...upload,
              content: content,
              metadata: {
                title: title,
                content: content,
                contentHash: contentHash,
                license: upload.license || upload.metadata?.license || 'All Rights Reserved',
                twitterHandle: twitterHandle,
                creator: creator,
                owner: creator,
                walletAddress: walletAddress,
              },
              owner: creator,
              creator: creator,
              walletAddress: walletAddress,
              timestamp: upload.timestamp || upload.createdAt || Math.floor(Date.now() / 1000),
              verification: verification
            };
            enrichedUploads.push(enrichedUpload);
            verificationResults.push(verification);
            console.log('🔍 Successfully enriched upload:', enrichedUpload);
          } else {
            console.error('🔍 Failed to fetch content - HTTP error:', response.status, response.statusText);
          }
        } catch (e: unknown) {
          console.error('🔍 Failed to fetch content for upload:', e);
          if (e instanceof Error) {
            console.error('🔍 Error details:', e.message, e.stack);
          }
        }
      }
      
      console.log('🔍 Enriched uploads:', enrichedUploads);
      setVerificationResults(verificationResults);
      
      // Add debug info to help troubleshoot
      if (enrichedUploads.length > 0) {
        console.log('🔍 Sample enriched upload structure:', enrichedUploads[0]);
        console.log('🔍 Available fields:', Object.keys(enrichedUploads[0]));
        console.log('🔍 Creator field:', enrichedUploads[0].creator);
        console.log('🔍 Owner field:', enrichedUploads[0].owner);
        console.log('🔍 Metadata:', enrichedUploads[0].metadata);
      }
      
      // Filter data based on search criteria - OPTIMIZED FOR SPEED
      let filteredData = enrichedUploads;
      
      if (searchType === 'hash') {
        const searchHash = input.trim().toLowerCase();
        console.log('🔍 Fast filtering by hash:', searchHash);
        
        // Early return if no search hash
        if (!searchHash) {
          setError('Please enter a content hash to search.');
          return;
        }
        
        // Optimized single-pass filter with early return
        filteredData = enrichedUploads.filter((item: any) => {
          const itemHash = item.metadata?.contentHash || item.hash;
          if (!itemHash) return false;
          
          // Direct comparison without toLowerCase() conversion
          return itemHash.toLowerCase() === searchHash;
        });
        
        console.log('🔍 Fast hash filter result:', filteredData.length, 'items');
        
        if (filteredData.length === 0) {
          setError(`No content found for hash: ${input.trim()}. This content may not be registered.`);
          return;
        }
      }

      // Set results immediately without additional processing
      setNfts(filteredData);
      setError(''); // Clear any previous errors
      setDebugInfo(null);
      console.log('🔍 Fast search completed:', filteredData.length, 'items');

    } catch (e: unknown) {
      console.error('❌ Search error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(`Error searching for content: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // Remove auto-search - only search when user clicks the search button
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Registry Viewer</span>
        </CardTitle>
        <CardDescription>
          Enter a content hash (66 chars) for exact content match. Twitter handles are displayed as creators when available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Network switch button if not on Camp Network */}
        {chainId !== CAMP_CHAIN_ID && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 flex flex-col items-center">
            <p className="mb-2">You are not connected to Camp Network BaseCAMP.</p>
            <button
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
              onClick={() => {
                if (switchChain) {
                  switchChain({ chainId: CAMP_CHAIN_ID });
                } else {
                  toast.error('Network switching not supported by your wallet.');
                }
              }}
              disabled={isSwitching}
            >
              {isSwitching ? 'Switching...' : 'Switch to Camp Network'}
            </button>
            {switchError && (
              <p className="mt-2 text-red-600">{switchError.message || 'Failed to switch network.'}</p>
            )}
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="input">Content Hash</Label>
            <div className="flex space-x-2">
              <Input 
                id="input" 
                placeholder="0x1234... (content hash)" 
                value={input} 
                onChange={e => handleInputChange(e.target.value)} 
                className="flex-1" 
              />
              <Button onClick={handleSearch} disabled={!input.trim() || isLoading || !origin}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <div className="text-sm text-blue-600 font-medium">
              💡 Enter a 66-character hex string to find exact content match.
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
          )}

          {/* Debug Information Section */}
          {debugInfo && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-yellow-800">🔍 Debug Information</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDebugInfo(null)}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-2 text-xs text-yellow-700">
                <div>
                  <strong>Origin Available:</strong> {debugInfo.originAvailable ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Raw Uploads Count:</strong> {debugInfo.uploads?.length || 0}
                </div>
                <div>
                  <strong>Enriched Uploads Count:</strong> {debugInfo.enrichedUploads?.length || 0}
                </div>
                <div>
                  <strong>Fetch Errors:</strong> {debugInfo.fetchErrors?.length || 0}
                </div>
                <div>
                  <strong>Search Criteria:</strong> {JSON.stringify(debugInfo.searchCriteria)}
                </div>
                
                {debugInfo.uploads && debugInfo.uploads.length > 0 && (
                  <div>
                    <strong>Sample Raw Upload:</strong>
                    <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                      {JSON.stringify(debugInfo.uploads[0], null, 2)}
                    </pre>
                  </div>
                )}
                
                {debugInfo.fetchErrors && debugInfo.fetchErrors.length > 0 && (
                  <div>
                    <strong>Fetch Errors:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {debugInfo.fetchErrors.slice(0, 5).map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {nfts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Found {nfts.length} item{nfts.length !== 1 ? 's' : ''}
                </h3>
                <div className="text-sm text-gray-500">
                  Origin SDK Content
                </div>
              </div>
              
              {nfts.map((nft, idx) => (
                <Card key={nft.id || nft.hash || idx} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>{nft.metadata?.title || 'Untitled'}</span>
                        {/* Verification Status */}
                        {nft.verification && (
                          <div className="flex items-center space-x-1 text-xs">
                            <span className={nft.verification.isHashMatch ? "text-green-500" : "text-red-500"}>
                              {nft.verification.isHashMatch ? "✓" : "✗"} Hash
                            </span>
                            <span className={nft.verification.isRegisteredOnChain ? "text-green-500" : "text-yellow-500"}>
                              {nft.verification.isRegisteredOnChain ? "✓" : "⚠"} Chain
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(nft.metadata?.contentHash || 'N/A')}
                        className="flex items-center space-x-2"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy Hash</span>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">License</Label>
                        <p className="text-sm text-gray-600">
                          {nft.metadata?.license}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Creator</Label>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <div className="flex flex-col">
                            {nft.creator && nft.creator !== 'Unknown' && !nft.creator.startsWith('0x') ? (
                              <span className="text-sm text-blue-600 font-medium">
                                @{nft.creator}
                              </span>
                            ) : (
                              <code className="text-sm font-mono text-gray-700">
                                {nft.walletAddress || nft.creator || 'Wallet address not available'}
                              </code>
                            )}
                            {nft.walletAddress && nft.walletAddress !== '0x0000000000000000000000000000000000000000' && (
                              <span className="text-xs text-gray-500">
                                Wallet: {nft.walletAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Content Hash</Label>
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <code className="text-sm font-mono text-gray-700 break-all">
                          {nft.metadata?.contentHash || 'N/A'}
                        </code>
                        {nft.metadata?.contentHash && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(nft.metadata.contentHash)}
                            className="ml-2"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        )}
                      </div>
                      {nft.metadata?.contentHash && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 Copy this hash to search for this exact content in the registry viewer
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Registration Date</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {nft.timestamp ? new Date(Number(nft.timestamp) * 1000).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {(nft.metadata?.twitterHandle) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Twitter Handle</Label>
                        <p className="text-sm text-blue-600">
                          @{nft.metadata.twitterHandle}
                        </p>
                      </div>
                    )}

                    {/* Verification Details */}
                    {nft.verification && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Verification Status</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center space-x-2">
                            {nft.verification.isHashMatch ? (
                              <span className="text-green-500">✓ Hash Match</span>
                            ) : (
                              <span className="text-red-500">✗ Hash Match</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {nft.verification.isRegisteredOnChain ? (
                              <span className="text-green-500">✓ On Blockchain</span>
                            ) : (
                              <span className="text-yellow-500">⚠ On Blockchain</span>
                            )}
                          </div>
                        </div>
                        {nft.verification.blockchainData && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <strong>Blockchain Data:</strong>
                            <pre className="mt-1 overflow-x-auto">
                              {JSON.stringify(nft.verification.blockchainData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {nft.metadata?.content && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Content Preview</Label>
                        <pre className="bg-black text-white p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          {nft.metadata.content.length > 200 
                            ? `${nft.metadata.content.substring(0, 200)}...` 
                            : nft.metadata.content}
                        </pre>
                      </div>
                    )}

                    {nft.metadata?.twitter && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Twitter Data</Label>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          {JSON.stringify(nft.metadata.twitter, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info about data sources */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
            <p className="text-sm">
              <strong>How it works:</strong> 
              <br />• <strong>WritingRegistry Search:</strong> Enter a 66-character hex string to search the blockchain registry directly
              <br />• <strong>Twitter Handle Creator:</strong> Twitter handles are displayed as creators when available from the blockchain
              <br />• <strong>Copy & Search:</strong> Use the Copy button next to any content hash, then paste it in the search field above
              <br />• <strong>Blockchain Verification:</strong> System automatically verifies content against the WritingRegistry smart contract
              <br />• <strong>Origin SDK Fallback:</strong> For non-hash searches, falls back to IPFS content via Origin SDK
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 