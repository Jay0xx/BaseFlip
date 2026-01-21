'use client';

import React, { ReactNode } from 'react';
import {
    RainbowKitProvider,
    darkTheme,
    connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
    metaMaskWallet,
    coinbaseWallet,
    walletConnectWallet,
    trustWallet,
    rainbowWallet,
    injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

// WalletConnect Cloud Project ID - Get your own at https://cloud.walletconnect.com
const projectId = 'a01e2f3b4c5d6e7f8a9b0c1d2e3f4a5b';

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Recommended',
            wallets: [
                injectedWallet, // Detects in-app browsers (MetaMask Mobile, Trust, etc.)
                metaMaskWallet,
                coinbaseWallet,
                walletConnectWallet,
                trustWallet,
                rainbowWallet,
            ],
        },
    ],
    {
        appName: 'BaseFlip',
        projectId,
    }
);

const config = createConfig({
    connectors,
    chains: [baseSepolia],
    transports: {
        [baseSepolia.id]: http(),
    },
    ssr: true,
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

export function Providers({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider 
                    modalSize="compact"
                    theme={darkTheme({
                        accentColor: '#00BFFF',
                        accentColorForeground: 'white',
                        borderRadius: 'small',
                        fontStack: 'system',
                        overlayBlur: 'small',
                    })}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
