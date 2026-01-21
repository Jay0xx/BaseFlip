export const BASEFLIP_ADDRESS = "0x091e25A02922cf956Fff137C77c5F2F4105fCF3a";

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
