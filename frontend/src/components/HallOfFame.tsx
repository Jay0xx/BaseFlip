'use client';

import { formatUnits } from 'viem';
import { FlipEvent } from '@/constants';

interface HallOfFameProps {
    history: FlipEvent[];
}

export default function HallOfFame({ history }: HallOfFameProps) {
    // 1. Group by player and calculate net profit
    // Profit = Payout - Amount (if loss, payout is 0, so profit is -Amount)
    const playerStats = history.reduce((acc: Record<string, { player: string; netProfit: bigint; wins: number; totalBets: number; txHash: string }>, flip) => {
        const player = flip.player;
        if (!acc[player]) {
            acc[player] = {
                player,
                netProfit: BigInt(0),
                wins: 0,
                totalBets: 0,
                txHash: flip.txHash // Keep latest txHash for linking
            };
        }

        const profit = flip.payout - flip.amount;
        acc[player].netProfit += profit;
        acc[player].totalBets += 1;
        if (flip.won) acc[player].wins += 1;

        return acc;
    }, {});

    // 2. Convert to array, filter for positive profit, and sort descending
    const topProfitable = Object.values(playerStats)
        .filter(stats => stats.netProfit > BigInt(0))
        .sort((a, b) => {
            const diff = b.netProfit - a.netProfit;
            return diff > BigInt(0) ? 1 : diff < BigInt(0) ? -1 : 0;
        })
        .slice(0, 3); // Top 3 as requested

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const getRankColor = (index: number) => {
        switch (index) {
            case 0: return 'text-yellow-400'; // Gold
            case 1: return 'text-gray-300';   // Silver
            case 2: return 'text-orange-400'; // Bronze
            default: return 'text-electric-cyan';
        }
    };

    const getRankShadow = (index: number) => {
        switch (index) {
            case 0: return 'shadow-[0_0_15px_rgba(250,204,21,0.4)]';
            case 1: return 'shadow-[0_0_15px_rgba(209,213,219,0.3)]';
            case 2: return 'shadow-[0_0_15px_rgba(251,146,60,0.3)]';
            default: return 'shadow-[0_0_10px_rgba(0,255,255,0.2)]';
        }
    };

    return (
        <div className="w-full max-w-2xl mt-12 animate-in fade-in zoom-in duration-700">
            <div className="flex flex-col items-center justify-center space-y-2 mb-8">
                <div className="flex items-center space-x-4">
                    <span className="text-2xl">🏆</span>
                    <h2 className="text-xl md:text-2xl neon-glow font-arcade text-center">
                        WEEKLY CHAMPIONS
                    </h2>
                    <span className="text-2xl">🏆</span>
                </div>
                <p className="text-[10px] font-arcade text-primary-blue/60 uppercase tracking-widest">
                    TOP 3 MOST PROFITABLE PLAYERS
                </p>
            </div>

            <div className="retro-panel p-4 md:p-6 border-4 border-electric-cyan/40 bg-navy/60 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                {topProfitable.length === 0 ? (
                    <div className="py-8 text-center text-primary-blue/60 font-retro italic uppercase">
                        &gt; NO PROFITABLE TRADERS LOGGED...
                        <br />
                        STRIKE IT BIG TO CLAIM YOUR SPOT
                    </div>
                ) : (
                    <div className="space-y-4">
                        {topProfitable.map((stats, idx) => (
                            <div
                                key={`${stats.player}-${idx}`}
                                className={`flex items-center justify-between p-4 border-2 border-primary-blue/20 bg-black/40 hover:border-electric-cyan transition-all group ${getRankShadow(idx)}`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`font-arcade text-lg ${getRankColor(idx)}`}>
                                        #{idx + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[10px] text-primary-blue/60 font-arcade uppercase">PLAYER</span>
                                            <span className="text-[8px] px-2 py-0.5 bg-primary-blue/10 text-primary-blue/80 font-arcade rounded">
                                                {stats.wins}W / {stats.totalBets}T
                                            </span>
                                        </div>
                                        <a
                                            href={`https://sepolia.basescan.org/address/${stats.player}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-sm text-white hover:text-electric-cyan transition-colors"
                                        >
                                            {formatAddress(stats.player)}
                                        </a>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="block text-[10px] text-primary-blue/60 font-arcade uppercase">NET PROFIT</span>
                                    <span className={`font-arcade text-sm ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stats.netProfit >= 0 ? '+' : ''}{parseFloat(formatUnits(stats.netProfit, 18)).toFixed(6)} <span className="text-[10px]">ETH</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 text-[10px] text-center text-primary-blue/40 font-arcade uppercase tracking-[0.2em]">
                * RANKINGS RESET EVERY MONDAY *
            </div>
        </div>
    );
}
