'use client'

import { CampProvider } from '@campnetwork/origin/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { metaMask, coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

const queryClient = new QueryClient();

const apollo = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL || '',
  cache: new InMemoryCache(),
});

// Camp Network BaseCAMP chain config
const campNetwork = {
  id: 123420001114,
  name: 'Camp Network BaseCAMP',
  network: 'basecamp',
  nativeCurrency: {
    name: 'CAMP',
    symbol: 'CAMP',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_CAMP_NETWORK_RPC || 'https://rpc.basecamp.t.raas.gelato.cloud'] },
    public: { http: [process.env.NEXT_PUBLIC_CAMP_NETWORK_RPC_2 || 'https://rpc-campnetwork.xyz'] },
  },
  blockExplorers: {
    default: { name: 'BaseCAMP Explorer', url: process.env.NEXT_PUBLIC_CAMP_NETWORK_EXPLORER || 'https://basecamp.cloud.blockscout.com/' },
  },
  testnet: false,
};

const config = createConfig({
  chains: [campNetwork],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: 'Writing Registry' }),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo', showQrModal: true }),
    injected(),
  ],
  transports: {
    [campNetwork.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {/* CampProvider handles wallet and social login (MetaMask, WalletConnect, Twitter, etc.) */}
        <CampProvider clientId={process.env.NEXT_PUBLIC_ORIGIN_CLIENT_ID || ''}>
          <ApolloProvider client={apollo}>
            {children}
          </ApolloProvider>
        </CampProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 