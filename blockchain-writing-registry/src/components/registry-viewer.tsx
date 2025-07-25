'use client'

import { useState } from 'react';
import { useAuth } from '@campnetwork/origin/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Hash, Calendar, User, FileText } from 'lucide-react';
import { fetchUserByUsername } from '@/lib/utils';

export function RegistryViewer() {
  const { origin } = useAuth();
  const [input, setInput] = useState('');
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!origin || !input.trim()) return;
    setIsLoading(true);
    setError('');
    setNfts([]);
    try {
      const uploads = await origin.getOriginUploads();
      let filtered: any[] = [];
      if (input.startsWith('@')) {
        // Twitter handle search
        filtered = uploads.filter((u: any) =>
          u.twitterHandle?.toLowerCase() === input.trim().toLowerCase().replace('@', '')
        );
      } else {
        // Wallet address search
        filtered = uploads.filter((u: any) =>
          u.owner?.toLowerCase() === input.trim().toLowerCase()
        );
      }
      setNfts(filtered || []);
      if (!filtered || filtered.length === 0) setError('No NFTs found for this input.');
    } catch (e) {
      setError('Error fetching NFTs.');
    } finally {
      setIsLoading(false);
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
          Enter your wallet address or Twitter handle to view your registered content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="input">Wallet Address or Twitter Handle</Label>
            <div className="flex space-x-2">
              <Input id="input" placeholder="0x... or @handle" value={input} onChange={e => setInput(e.target.value)} className="flex-1" />
              <Button onClick={handleSearch} disabled={!input.trim() || isLoading}>Search</Button>
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
                <Card key={nft.id || idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>{nft.metadata?.title || 'Untitled'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">License</Label>
                        <p className="text-sm text-gray-600">{nft.metadata?.license}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Creator</Label>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <code className="text-sm font-mono text-gray-700">
                            {nft.owner}
                          </code>
                        </div>
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
                    {nft.metadata?.twitterHandle && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Twitter Handle</Label>
                        <p className="text-sm text-blue-600">
                          @{nft.metadata.twitterHandle}
                        </p>
                      </div>
                    )}
                    {nft.metadata?.twitter && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Twitter Data</Label>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(nft.metadata.twitter, null, 2)}
                        </pre>
                      </div>
                    )}
                    {nft.metadata?.content && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Content</Label>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {nft.metadata.content}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 