'use client';

import React, { ReactNode } from 'react';
import {
    RainbowKitProvider,
    getDefaultConfig,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

// Using a placeholder project ID - user should ideally provide one from WalletConnect Cloud
const config = getDefaultConfig({
    appName: 'BaseFlip',
    projectId: '956402fc66c98ea98a96440266fc0319', // Generic placeholder for dev
    chains: [baseSepolia],
    ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme({
                    accentColor: '#00BFFF',
                    accentColorForeground: 'white',
                    borderRadius: 'small',
                    fontStack: 'system',
                    overlayBlur: 'small',
                })}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
