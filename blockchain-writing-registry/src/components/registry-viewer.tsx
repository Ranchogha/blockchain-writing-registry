'use client'

import { useState } from 'react';
import { useAuth } from '@campnetwork/origin/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Hash, Calendar, User, FileText, Database, Zap, Copy } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain, useContractReads } from 'wagmi';
import { toast } from 'react-hot-toast';

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
  const [searchType, setSearchType] = useState<'address' | 'twitter' | 'hash'>('address');
  const [dataSource, setDataSource] = useState<'origin' | 'contract'>('origin');

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Content hash copied to clipboard!');
  };

  const handleSearch = async () => {
    if (!input.trim()) {
      toast.error('Please enter a search term.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setNfts([]);

    try {
      if (dataSource === 'origin') {
        // Use Origin SDK
        if (!origin) {
          setError('Origin SDK not available. Please connect your wallet.');
          return;
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
        
        // Fetch full content and metadata for each upload
        let enrichedUploads = [];
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

              // Parse title (first non-empty line or line starting with Title:)
              let title = 'Untitled';
              let twitterHandle = '';
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

              // Use actual creator/owner if available
              const owner = upload.owner || upload.creator || 'Unknown';
              const creator = upload.creator || upload.owner || 'Unknown';

              // Create enriched upload with metadata
              const enrichedUpload = {
                ...upload,
                content: content,
                metadata: {
                  title: title,
                  content: content,
                  contentHash: `0x${Buffer.from(content).toString('hex').substring(0, 64)}`,
                  license: 'All Rights Reserved',
                  twitterHandle: twitterHandle || '',
                },
                owner: owner,
                creator: creator,
                timestamp: Math.floor(Date.now() / 1000)
              };
              enrichedUploads.push(enrichedUpload);
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
        
        let filtered: any[] = [];
        
        if (searchType === 'twitter') {
          const handle = input.trim().replace('@', '').toLowerCase();
          filtered = enrichedUploads.filter((u: any) =>
            u.metadata?.twitterHandle?.replace('@', '').toLowerCase() === handle
          );
        } else if (searchType === 'hash') {
          const searchHash = input.trim().toLowerCase();
          filtered = enrichedUploads.filter((u: any) =>
            u.metadata?.contentHash?.toLowerCase() === searchHash
          );
        } else {
          const searchAddress = input.trim().toLowerCase();
          filtered = enrichedUploads.filter((u: any) =>
            u.owner?.toLowerCase() === searchAddress || u.creator?.toLowerCase() === searchAddress
          );
        }
        setNfts(filtered || []);
        if (!filtered || filtered.length === 0) {
          setError(`No registered content found for this search. (Searched ${enrichedUploads?.length || 0} total items)`);
        }
      } else {
        // Use WritingRegistry contract (mock data for now)
        // In a real implementation, you'd need to index events or use a subgraph
        const mockProofs = [
          {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            title: 'Sample Story from Contract',
            license: 'All Rights Reserved',
            twitterHandle: 'sampleuser',
            timestamp: Math.floor(Date.now() / 1000) - 86400,
            creator: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
          }
        ];
        
        let filtered: any[] = [];
        if (searchType === 'twitter') {
          const handle = input.trim().replace('@', '');
          filtered = mockProofs.filter(proof => 
            proof.twitterHandle?.toLowerCase() === handle.toLowerCase()
          );
        } else if (searchType === 'hash') {
          const searchHash = input.trim().toLowerCase();
          filtered = mockProofs.filter(proof => 
            proof.hash.toLowerCase() === searchHash
          );
        } else {
          const searchAddress = input.trim().toLowerCase();
          filtered = mockProofs.filter(proof => 
            proof.creator.toLowerCase() === searchAddress
          );
        }
        
        setNfts(filtered);
        if (filtered.length === 0) {
          setError('No WritingRegistry content found for this search.');
        }
      }
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
    // Auto-detect search type
    if (value.startsWith('@') || value.includes('twitter.com')) {
      setSearchType('twitter');
    } else if (value.startsWith('0x') && value.length === 42) {
      setSearchType('address');
    } else if (value.startsWith('0x') && value.length === 66) {
      setSearchType('hash');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Registry Viewer</span>
        </CardTitle>
        <CardDescription>
          Enter a wallet address to see all registered content, Twitter handle for specific content, or content hash for exact match.
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

        {/* Data Source Toggle */}
        <div className="mb-4 p-4 bg-orange-100 border border-orange-200 rounded-md">
          <Label className="text-sm font-medium mb-2 block text-orange-800">Data Source</Label>
          <div className="text-sm text-orange-700 font-semibold">Origin SDK</div>
          <p className="text-xs text-orange-700 mt-2">Searching Origin SDK registered content</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="input">Wallet Address, Twitter Handle, or Content Hash</Label>
            <div className="flex space-x-2">
                              <Input 
                id="input" 
                placeholder="0x... (address/hash) or @handle" 
                value={input} 
                onChange={e => handleInputChange(e.target.value)} 
                className="flex-1" 
              />
              <Button onClick={handleSearch} disabled={!input.trim() || isLoading || (dataSource === 'origin' && !origin)}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              Search type: {searchType === 'twitter' ? 'Twitter Handle' : searchType === 'hash' ? 'Content Hash' : 'Wallet Address'} 
              {searchType === 'address' && ' (shows all content for this address)'}
              {searchType === 'hash' && ' (exact match)'}
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

          {nfts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Found {nfts.length} item{nfts.length !== 1 ? 's' : ''} for {searchType === 'twitter' ? 'Twitter handle' : searchType === 'hash' ? 'content hash' : 'wallet address'}
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
                          <code className="text-sm font-mono text-gray-700">
                            {nft.creator}
                          </code>
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
                      </div>
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

                    {nft.metadata?.content && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Content Preview</Label>
                        <pre className="bg-white p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
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
              <br />• <strong>Wallet Address:</strong> Shows ALL content registered by that address
              <br />• <strong>Twitter Handle:</strong> Shows content with that specific Twitter handle
              <br />• <strong>Content Hash:</strong> Shows exact content match (66-character hex string)
              <br />• <strong>Copy Hash:</strong> Click to copy the content hash for verification
              <br />• <strong>Origin SDK:</strong> Shows registered content via <code>origin.mintFile()</code>
              <br />• <strong>WritingRegistry:</strong> Shows content from your smart contract
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 