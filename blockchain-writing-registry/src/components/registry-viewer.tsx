'use client'

import { useState, useEffect } from 'react'
import { useContractRead } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search, Hash, Calendar, User, FileText } from 'lucide-react'

// Contract ABI for reading
const CONTRACT_ABI = [
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
]

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x...'

interface Proof {
  title: string
  license: string
  twitterHandle: string
  timestamp: bigint
  creator: string
}

export function RegistryViewer() {
  const [searchHash, setSearchHash] = useState('')
  const [currentHash, setCurrentHash] = useState('')

  const { data: isRegistered } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'isHashRegistered',
    args: [currentHash],
    query: { enabled: currentHash.length === 66 },
  })

  const { data: proof, isLoading } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getProof',
    args: [currentHash],
    query: { enabled: isRegistered === true },
  })

  const handleSearch = () => {
    if (searchHash.trim()) {
      setCurrentHash(searchHash.trim())
    }
  }

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const proofTyped = proof as Proof | undefined;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Registry Viewer</span>
        </CardTitle>
        <CardDescription>
          Search for registered content by its SHA-256 hash
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="search-hash">Content Hash</Label>
            <div className="flex space-x-2">
              <Input
                id="search-hash"
                placeholder="0x..."
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!searchHash.trim()}>
                Search
              </Button>
            </div>
          </div>

          {currentHash && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Hash className="h-4 w-4" />
                  <span>Hash: {currentHash}</span>
                </div>
                <div className="mt-2">
                  {isRegistered === true ? (
                    <span className="text-green-600 text-sm">✓ Registered</span>
                  ) : isRegistered === false ? (
                    <span className="text-red-600 text-sm">✗ Not Registered</span>
                  ) : (
                    <span className="text-gray-600 text-sm">Checking...</span>
                  )}
                </div>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {proofTyped && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>{proofTyped.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">License</Label>
                        <p className="text-sm text-gray-600">{proofTyped.license}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Creator</Label>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <code className="text-sm font-mono text-gray-700">
                            {proofTyped.creator}
                          </code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Registration Date</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatTimestamp(proofTyped.timestamp)}
                        </span>
                      </div>
                    </div>

                    {proofTyped.twitterHandle && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Twitter Handle</Label>
                        <p className="text-sm text-blue-600">
                          @{proofTyped.twitterHandle}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 