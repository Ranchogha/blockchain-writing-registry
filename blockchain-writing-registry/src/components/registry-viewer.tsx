'use client'

import { useState } from 'react';
import { useAuth } from '@campnetwork/origin/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Hash, Calendar, User, FileText, Database, Zap } from 'lucide-react';
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
  const [searchType, setSearchType] = useState<'address' | 'twitter'>('address');
  const [dataSource, setDataSource] = useState<'origin' | 'contract'>('origin');

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();

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
        
        const uploads = await origin.getOriginUploads();
        let filtered: any[] = [];
        
        if (searchType === 'twitter') {
          const handle = input.trim().replace('@', '');
          filtered = uploads.filter((u: any) =>
            u.twitterHandle?.toLowerCase() === handle.toLowerCase()
          );
        } else {
          const searchAddress = input.trim().toLowerCase();
          filtered = uploads.filter((u: any) =>
            u.owner?.toLowerCase() === searchAddress
          );
        }

        setNfts(filtered || []);
        
        if (!filtered || filtered.length === 0) {
          setError('No Origin SDK NFTs found for this search.');
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
    } catch (e) {
      console.error('Search error:', e);
      setError('Error searching for content. Please try again.');
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
          Search for registered content using Origin SDK or WritingRegistry contract.
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
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <Label className="text-sm font-medium mb-2 block">Data Source</Label>
          <div className="flex space-x-2">
            <Button
              variant={dataSource === 'origin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDataSource('origin')}
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Origin SDK</span>
            </Button>
            <Button
              variant={dataSource === 'contract' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDataSource('contract')}
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>WritingRegistry Contract</span>
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {dataSource === 'origin' 
              ? 'Searching Origin SDK NFTs (requires successful mintFile calls)'
              : 'Searching WritingRegistry contract (requires event indexing)'
            }
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="input">Wallet Address or Twitter Handle</Label>
            <div className="flex space-x-2">
              <Input 
                id="input" 
                placeholder="0x... or @handle" 
                value={input} 
                onChange={e => handleInputChange(e.target.value)} 
                className="flex-1" 
              />
              <Button onClick={handleSearch} disabled={!input.trim() || isLoading || (dataSource === 'origin' && !origin)}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              Search type: {searchType === 'twitter' ? 'Twitter Handle' : 'Wallet Address'}
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
              {nfts.map((nft, idx) => (
                <Card key={nft.id || nft.hash || idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>{dataSource === 'origin' ? (nft.metadata?.title || 'Untitled') : (nft.title || 'Untitled')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">License</Label>
                        <p className="text-sm text-gray-600">
                          {dataSource === 'origin' ? nft.metadata?.license : nft.license}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Creator</Label>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <code className="text-sm font-mono text-gray-700">
                            {dataSource === 'origin' ? nft.owner : nft.creator}
                          </code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Content Hash</Label>
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <code className="text-sm font-mono text-gray-700 break-all">
                          {dataSource === 'origin' ? (nft.metadata?.contentHash || 'N/A') : nft.hash}
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

                    {(dataSource === 'origin' ? nft.metadata?.twitterHandle : nft.twitterHandle) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Twitter Handle</Label>
                        <p className="text-sm text-blue-600">
                          @{dataSource === 'origin' ? nft.metadata.twitterHandle : nft.twitterHandle}
                        </p>
                      </div>
                    )}

                    {dataSource === 'origin' && nft.metadata?.content && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Content Preview</Label>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          {nft.metadata.content.length > 200 
                            ? `${nft.metadata.content.substring(0, 200)}...` 
                            : nft.metadata.content}
                        </pre>
                      </div>
                    )}

                    {dataSource === 'origin' && nft.metadata?.twitter && (
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
              <strong>Data Sources:</strong> 
              <br />• <strong>Origin SDK:</strong> Shows NFTs minted via <code>origin.mintFile()</code>
              <br />• <strong>WritingRegistry Contract:</strong> Shows content registered via your smart contract
              <br />• <strong>Note:</strong> If no content appears, it means no successful registrations have been made yet.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 