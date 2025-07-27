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
    []
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
        console.log('🔍 Using WritingRegistry contract + Origin SDK for hash:', input.trim());
        
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
        
        // Check Origin SDK for content display
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
                        url: upload.url,
                        upload: upload // Keep full Origin upload data for UI
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
            // Use blockchain data for verification
            blockchainData: blockchainData,
            // Use Origin data for display
            originData: originData,
            // Combine for display
            title: originData?.title || blockchainData?.title || 'Unknown',
            license: originData?.license || blockchainData?.license || 'Unknown',
            twitterHandle: originData?.twitterHandle || blockchainData?.twitterHandle || '',
            creator: originData?.creator || blockchainData?.creator || 'Unknown',
            walletAddress: originData?.walletAddress || blockchainData?.walletAddress || 'Unknown',
            timestamp: originData?.timestamp || blockchainData?.timestamp || '0',
            content: originData?.content || null,
            upload: originData?.upload || null,
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

      // For non-hash searches, show message to use hash search
      setError('Please enter a content hash (66-character hex string starting with 0x) to search the WritingRegistry contract.');

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
          Enter a content hash (66 chars) to search.
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
              <Button onClick={handleSearch} disabled={!input.trim() || isLoading || !origin} className="bg-orange-500 hover:bg-orange-600 text-white">
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <div className="text-sm text-orange-600 font-medium">
              💡 Enter a 66-character hex string to find exact content match.
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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
                  Origin SDK UI + WritingRegistry Data
                </div>
              </div>
              
              {nfts.map((item, idx) => (
                <Card key={item.id || item.hash || idx} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>{item.title || 'Untitled'}</span>
                        {item.verification?.isRegisteredOnChain && (
                          <span className="text-xs text-orange-500">✓ On Blockchain</span>
                        )}
                        {item.originData && (
                          <span className="text-xs text-orange-500">✓ Origin Content</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(item.hash || 'N/A')}
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
                          {item.license || 'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Creator</Label>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <div className="flex flex-col">
                            {item.creator && item.creator !== 'Unknown' && !item.creator.startsWith('0x') ? (
                              <span className="text-sm text-orange-600 font-medium">
                                @{item.creator}
                              </span>
                            ) : (
                              <code className="text-sm font-mono text-gray-700">
                                {item.walletAddress || item.creator || 'Wallet address not available'}
                              </code>
                            )}
                            {item.walletAddress && item.walletAddress !== '0x0000000000000000000000000000000000000000' && (
                              <span className="text-xs text-gray-500">
                                Wallet: {item.walletAddress}
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
                          {item.hash || 'N/A'}
                        </code>
                        {item.hash && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(item.hash)}
                            className="ml-2"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        )}
                      </div>
                      {item.hash && (
                        <p className="text-xs text-orange-600 mt-1">
                          💡 Copy this hash to search for this exact content in the registry viewer
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Registration Date</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {item.timestamp ? new Date(Number(item.timestamp) * 1000).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {item.twitterHandle && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Twitter Handle</Label>
                        <p className="text-sm text-orange-600">
                          @{item.twitterHandle}
                        </p>
                      </div>
                    )}

                    {/* Origin SDK Content Display */}
                    {item.content && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Content (Origin SDK)</Label>
                        <div className="bg-black p-4 rounded-lg border">
                          <pre className="text-sm text-white whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                            {item.content}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Blockchain Verification Status */}
                    {item.verification && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Verification Status</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center space-x-2">
                            {item.verification.isHashMatch ? (
                              <span className="text-orange-500">✓ Hash Match</span>
                            ) : (
                              <span className="text-red-500">✗ Hash Match</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.verification.isRegisteredOnChain ? (
                              <span className="text-orange-500">✓ On Blockchain</span>
                            ) : (
                              <span className="text-yellow-500">⚠ On Blockchain</span>
                            )}
                          </div>
                        </div>
                        {item.verification.blockchainData && (
                          <div className="mt-2 p-2 bg-black rounded text-xs">
                            <strong className="text-white">Blockchain Data:</strong>
                            <pre className="mt-1 overflow-x-auto text-green-400">
                              {JSON.stringify(item.verification.blockchainData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {item.verification?.searchTime && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Search Performance</Label>
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {item.verification.searchTime}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info about data sources */}
          <div className="p-4 bg-orange-500 border border-orange-600 rounded-md text-white">
            <p className="text-sm">
              <strong>How it works:</strong> 
              <br />Enter the content hash, search and confirm your content has been uploaded.
              <br />Thank you for registering your content.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 