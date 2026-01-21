'use client';

import { formatUnits } from 'viem';
import { FlipEvent } from '@/constants';

interface RecentFlipsProps {
    history: FlipEvent[];
    isLoading: boolean;
}

export default function RecentFlips({ history, isLoading }: RecentFlipsProps) {
    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className="w-full max-w-2xl mt-12 animate-in fade-in slide-in-from-bottom duration-1000">
            <h2 className="text-xl md:text-2xl mb-8 blue-glow font-arcade text-center">
                GLOBAL FEED
            </h2>

            <div className="retro-panel overflow-hidden border-2 border-primary-blue/30 bg-navy/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-primary-blue/20 text-[10px] md:text-xs font-arcade text-electric-cyan border-b-2 border-primary-blue/30">
                                <th className="p-3">PLAYER</th>
                                <th className="p-3">SIDE</th>
                                <th className="p-3">BET</th>
                                <th className="p-3 text-right">OUTCOME</th>
                            </tr>
                        </thead>
                        <tbody className="font-retro text-sm md:text-base">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-primary-blue/60 animate-pulse">
                                        &gt; ACCESSING DATA LOGS...
                                    </td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-primary-blue/60">
                                        &gt; NO DATA ON CHAIN. BE THE FIRST FLIPPER.
                                    </td>
                                </tr>
                            ) : (
                                history.map((flip, idx) => (
                                    <tr
                                        key={`${flip.txHash}-${idx}`}
                                        className={`border-b border-primary-blue/10 transition-colors hover:bg-white/5 ${flip.won ? 'text-green-400' : 'text-red-400/80'}`}
                                    >
                                        <td className="p-3 font-mono text-xs opacity-70">
                                            <a
                                                href={`https://sepolia.basescan.org/tx/${flip.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-electric-cyan"
                                            >
                                                {formatAddress(flip.player)}
                                            </a>
                                        </td>
                                        <td className="p-3 font-arcade text-[10px] uppercase">
                                            <span className="opacity-60 mr-2 text-[8px]">PICK:</span>
                                            <span className={flip.isHeads ? 'text-electric-cyan' : 'text-magenta-neon'}>
                                                {flip.isHeads ? 'HEADS' : 'TAILS'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {parseFloat(formatUnits(flip.amount, 18)).toFixed(6)} ETH
                                        </td>
                                        <td className="p-3 text-right font-arcade text-[10px]">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] opacity-40 mb-1">FINAL: {flip.result ? 'HEADS' : 'TAILS'}</span>
                                                {flip.won ? (
                                                    <span className="text-green-400 blue-glow animate-pulse">
                                                        WIN +{parseFloat(formatUnits(flip.payout, 18)).toFixed(6)}
                                                    </span>
                                                ) : (
                                                    <span className="text-red-400 opacity-60">LOSE</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 text-[10px] text-center text-primary-blue/40 font-arcade uppercase tracking-widest">
                * SCANNING BLOCKCHAIN FOR PLAYER ACTIVITY *
            </div>
        </div>
    );
}
