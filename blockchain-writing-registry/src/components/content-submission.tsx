'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Hash, FileText } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useAuth, useAuthState } from '@campnetwork/origin/react';
import { TwitterAPI } from '@campnetwork/origin';
import { useAccount, useChainId, useSwitchChain, useBalance, useWalletClient, useWriteContract } from 'wagmi';
import { getAddress } from 'viem';
import { useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// WritingRegistry ABI for the registerProof function
const WRITING_REGISTRY_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "hash", "type": "string"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "license", "type": "string"},
      {"internalType": "string", "name": "twitterHandle", "type": "string"}
    ],
    "name": "registerProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const WRITING_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0xb9C7cd7158805B03A8ADc999F6C08933E51BD97d';

// Camp Network chainId
const CAMP_CHAIN_ID = 123420001114;

export function ContentSubmission() {
  const { origin, jwt } = useAuth();
  const { authenticated } = useAuthState();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [license, setLicense] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [contentHash, setContentHash] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [preCheckError, setPreCheckError] = useState('');

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, chains, isPending: isSwitching, error: switchError } = useSwitchChain();
  const { data: balanceData } = useBalance({ address });
  const { data: walletClient } = useWalletClient();

  // Contract write for WritingRegistry
  const { writeContract, isPending: isWriting, data: txData } = useWriteContract();

  // Handle transaction success
  useEffect(() => {
    if (txData) {
      setTxHash(txData);
      setIsSuccess(true);
      toast.success('Content registered successfully on WritingRegistry contract!');
      console.log('✅ Transaction successful:', txData);
    }
  }, [txData]);

  const generateHash = (text: string) => {
    if (!text.trim()) return '';
    const hash = CryptoJS.SHA256(text).toString();
    return `0x${hash}`;
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    const hash = generateHash(value);
    setContentHash(hash);
  };

  // Pre-checks before submission
  const runPreChecks = useCallback(async () => {
    setPreCheckError('');
    if (!isConnected) {
      setPreCheckError('Please connect your wallet.');
      return false;
    }
    if (chainId !== CAMP_CHAIN_ID) {
      setPreCheckError('Please switch to Camp Network BaseCAMP.');
      return false;
    }
    if (!content.trim() || !title.trim() || !license) {
      setPreCheckError('Please fill in all required fields.');
      return false;
    }
    if (contentHash.length !== 66) {
      setPreCheckError('Content hash is invalid. Please check your content.');
      return false;
    }
    if (balanceData && balanceData.value < 1000000000000000n) { // 0.001 CAMP
      setPreCheckError('Insufficient balance for transaction.');
      return false;
    }
    return true;
  }, [isConnected, chainId, content, title, license, contentHash, balanceData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreCheckError('');
    const checksPassed = await runPreChecks();
    if (!checksPassed) {
      toast.error(preCheckError || 'Pre-check failed.');
      return;
    }
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (chainId !== CAMP_CHAIN_ID) {
      toast.error('Please switch to Camp Network BaseCAMP');
      return;
    }

    if (!writeContract) {
      toast.error('Contract not ready. Please check your input and try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      setIsSuccess(false);
      
      console.log('🔍 Calling WritingRegistry.registerProof with:', {
        hash: contentHash,
        title,
        license,
        twitterHandle,
        contractAddress: WRITING_REGISTRY_ADDRESS
      });

      // Call the WritingRegistry contract's registerProof function
      writeContract({
        address: WRITING_REGISTRY_ADDRESS,
        abi: WRITING_REGISTRY_ABI,
        functionName: 'registerProof',
        args: [contentHash, title, license, twitterHandle],
      });
      
      toast.success('Transaction submitted! Check your wallet for confirmation.');
      
    } catch (error: any) {
      console.error('Error registering proof:', error);
      if (error?.code === 4001) {
        toast.error('Transaction was rejected.');
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to register proof. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Register Your Content</span>
        </CardTitle>
        <CardDescription>
          Paste your written content to generate a SHA-256 hash and register it on the WritingRegistry smart contract
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
              <select
                id="license"
                value={license}
                onChange={e => setLicense(e.target.value)}
                required
                className="w-full border rounded p-2 bg-background text-foreground"
              >
                <option value="">Select license type</option>
                <option value="All Rights Reserved">All Rights Reserved</option>
                <option value="Creative Commons">Creative Commons</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter Handle</Label>
            <Input
              id="twitter"
              placeholder="@yourhandle"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
            />
          </div>

          {preCheckError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              <p>{preCheckError}</p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={!content.trim() || !title.trim() || !license || isWriting || !isConnected || chainId !== CAMP_CHAIN_ID}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isWriting ? 'Registering on Blockchain...' : 'Register Content'}
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
          {!authenticated && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 mt-2">
              Please connect your wallet to register content.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 