'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

// Camp Network (BaseCAMP) configuration
const campNetwork = {
  id: 123420001114,
  name: 'Camp Network BaseCAMP',
  network: 'basecamp',
  nativeCurrency: {
    decimals: 18,
    name: 'CAMP',
    symbol: 'CAMP',
  },
  rpcUrls: {
    public: {
      http: [
        'https://rpc.basecamp.t.raas.gelato.cloud',
        'https://rpc-campnetwork.xyz'
      ],
    },
    default: {
      http: ['https://rpc.basecamp.t.raas.gelato.cloud'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseCAMP Explorer',
      url: 'https://basecamp.cloud.blockscout.com/',
    },
  },
} as const

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [campNetwork, mainnet, polygon],
  [publicProvider()]
)

// Set up wagmi config
const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>
} 