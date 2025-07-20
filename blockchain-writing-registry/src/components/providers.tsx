'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { metaMask, walletConnect } from 'wagmi/connectors'

// Camp Network (BaseCAMP) configuration
const campNetwork = {
  id: 123420001114,
  name: 'basecamp',
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

// Set up wagmi config
export const config = createConfig({
  chains: [campNetwork, mainnet, polygon],
  connectors: [
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    }),
  ],
  transports: {
    [campNetwork.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  )
} 