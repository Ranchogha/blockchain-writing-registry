'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { writeContract } from 'wagmi/actions'
import { config } from './providers'
import { parseEther } from 'viem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Hash, FileText, Upload } from 'lucide-react'
import CryptoJS from 'crypto-js'

// Contract ABI - this will match your deployed contract
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      },
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
      }
    ],
    "name": "registerProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// Replace with your deployed contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x...'

export function ContentSubmission() {
  const { isConnected } = useAccount()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [license, setLicense] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [contentHash, setContentHash] = useState('')
  const [txHash, setTxHash] = useState('')
  const [isWriting, setIsWriting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const generateHash = (text: string) => {
    if (!text.trim()) return ''
    const hash = CryptoJS.SHA256(text).toString()
    return `0x${hash}`
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    const hash = generateHash(value)
    setContentHash(hash)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (!content.trim() || !title.trim() || !license) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsWriting(true)
      setIsSuccess(false)
      const tx = await writeContract(config, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'registerProof',
        args: [contentHash, title, license, twitterHandle],
      })
      setTxHash(tx)
      setIsSuccess(true)
    } catch (error) {
      console.error('Error registering proof:', error)
      alert('Error registering proof. Please try again.')
    } finally {
      setIsWriting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Register Your Content</span>
        </CardTitle>
        <CardDescription>
          Paste your written content to generate a SHA-256 hash and register it on Camp Network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Paste your written content here..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[200px]"
              required
            />
          </div>

          {contentHash && (
            <div className="space-y-2">
              <Label>Content Hash</Label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                <Hash className="h-4 w-4 text-gray-500" />
                <code className="text-sm font-mono text-gray-700 break-all">
                  {contentHash}
                </code>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter content title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">License *</Label>
              <Select value={license} onValueChange={setLicense}>
                <SelectTrigger>
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIT">MIT License</SelectItem>
                  <SelectItem value="CC-BY">Creative Commons Attribution</SelectItem>
                  <SelectItem value="CC-BY-SA">Creative Commons Attribution-ShareAlike</SelectItem>
                  <SelectItem value="CC-BY-NC">Creative Commons Attribution-NonCommercial</SelectItem>
                  <SelectItem value="All Rights Reserved">All Rights Reserved</SelectItem>
                  <SelectItem value="Public Domain">Public Domain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter Handle (Optional)</Label>
            <Input
              id="twitter"
              placeholder="@yourhandle"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="orange"
            disabled={!isConnected || isWriting || !content.trim() || !title.trim() || !license}
            className="w-full"
          >
            {isWriting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Registering...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Register Content</span>
              </div>
            )}
          </Button>

          {isSuccess && txHash && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">
                Content successfully registered on Camp Network!
              </p>
              <p className="text-sm text-green-600 mt-1">
                Transaction Hash: {txHash}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
} 