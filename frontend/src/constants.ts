import { baseSepolia } from 'wagmi/chains';

export const BASEFLIP_ADDRESS = "0x091e25A02922cf956Fff137C77c5F2F4105fCF3a";

// Multiple RPC endpoints for fallback support
export const BASE_SEPOLIA_RPCS = [
  'https://sepolia.base.org',
  'https://base-sepolia-rpc.publicnode.com',
  'https://base-sepolia.blockpi.network/v1/rpc/public',
];

// Chain configuration with multiple RPCs for better wallet compatibility
export const baseSepoliaChain = {
  ...baseSepolia,
  rpcUrls: {
    default: {
      http: BASE_SEPOLIA_RPCS,
    },
    public: {
      http: BASE_SEPOLIA_RPCS,
    },
  },
};

export const baseFlipABI = [
    {
        "inputs": [
            { "internalType": "bool", "name": "_isHeads", "type": "bool" }
        ],
        "name": "flip",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_amount", "type": "uint256" }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxBet",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "bool", "name": "isHeads", "type": "bool" }
        ],
        "name": "BetPlaced",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "bool", "name": "isHeads", "type": "bool" },
            { "indexed": false, "internalType": "bool", "name": "result", "type": "bool" },
            { "indexed": false, "internalType": "bool", "name": "won", "type": "bool" },
            { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" }
        ],
        "name": "FlipOutcome",
        "type": "event"
    }
] as const;

export interface FlipEvent {
    player: string;
    amount: bigint;
    isHeads: boolean;
    result: boolean;
    won: boolean;
    payout: bigint;
    txHash: string;
    blockNumber: bigint;
}

// Helper to add/switch to Base Sepolia in wallets that don't have it
export async function addBaseSepoliaToWallet() {
    if (typeof window.ethereum === 'undefined') return false;
    
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: '0x14a34', // 84532 in hex
                chainName: 'Base Sepolia',
                nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18,
                },
                rpcUrls: BASE_SEPOLIA_RPCS,
                blockExplorerUrls: ['https://sepolia.basescan.org'],
            }],
        });
        return true;
    } catch (error) {
        console.error('Failed to add Base Sepolia to wallet:', error);
        return false;
    }
}

// Declare ethereum for TypeScript
declare global {
    interface Window {
        ethereum?: any;
    }
}
