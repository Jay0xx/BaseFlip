'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useSwitchChain,
  usePublicClient,
  useReadContract
} from 'wagmi';
import { parseUnits, formatUnits, parseEther, decodeEventLog } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import confetti from 'canvas-confetti';
import CoinSelector from '@/components/CoinSelector';
import BetInput from '@/components/BetInput';
import FlipButton from '@/components/FlipButton';
import RecentFlips from '@/components/RecentFlips';
import HallOfFame from '@/components/HallOfFame';
import { BASEFLIP_ADDRESS, baseFlipABI, FlipEvent } from '@/constants';
import { arcadeAudio } from '@/utils/audio';
import CoinFlipAnimation from '@/components/CoinFlipAnimation';

export default function Home() {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  // Game UI State
  const [selectedSide, setSelectedSide] = useState(true); // true = Heads
  const [betAmount, setBetAmount] = useState('0.001');
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastResult, setLastResult] = useState<{ won: boolean; payout: string; resultText: string } | null>(null);
  const [coinOutcome, setCoinOutcome] = useState<'heads' | 'tails' | null>(null);
  const [showFaucetModal, setShowFaucetModal] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [minSpinActive, setMinSpinActive] = useState(false);

  // Global History State
  const [history, setHistory] = useState<FlipEvent[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Admin State
  const [customWithdrawAmount, setCustomWithdrawAmount] = useState('0.1');

  // 1. Balances & Protocol Stats
  const { data: ethBalance, refetch: refetchBalance } = useBalance({
    address: address,
  });

  const { data: protocolBalance, refetch: refetchProtocolBalance } = useBalance({
    address: BASEFLIP_ADDRESS,
  });

  const { data: contractOwner } = useReadContract({
    address: BASEFLIP_ADDRESS,
    abi: baseFlipABI,
    functionName: 'owner',
  });

  const MAX_BET = 1000; // Effectively unlimited for UI
  const isOwner = address?.toLowerCase() === (contractOwner as string)?.toLowerCase();

  // 2. Contract Writes
  const { data: hash, writeContract, isPending: isWritePending, error: writeError } = useWriteContract();

  // 3. Transaction Tracking - Polling aggressively (1s) to eliminate reveal lag
  const { data: receipt, isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 1000,
  });

  // 4. Fetch Historical Events
  useEffect(() => {
    async function fetchPastEvents() {
      if (!publicClient) return;
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const logs = await publicClient.getLogs({
          address: BASEFLIP_ADDRESS,
          event: {
            anonymous: false,
            inputs: [
              { indexed: true, internalType: "address", name: "player", type: "address" },
              { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
              { indexed: false, internalType: "bool", name: "isHeads", type: "bool" },
              { indexed: false, internalType: "bool", name: "result", type: "bool" },
              { indexed: false, internalType: "bool", name: "won", type: "bool" },
              { indexed: false, internalType: "uint256", name: "payout", type: "uint256" }
            ],
            name: "FlipOutcome",
            type: "event"
          },
          fromBlock: currentBlock - BigInt(50000) > BigInt(0) ? currentBlock - BigInt(50000) : BigInt(0),
          toBlock: currentBlock,
        });

        const formattedLogs: FlipEvent[] = logs.map(log => ({
          player: (log.args as any).player,
          amount: (log.args as any).amount,
          isHeads: (log.args as any).isHeads,
          result: (log.args as any).result,
          won: (log.args as any).won,
          payout: (log.args as any).payout,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber || BigInt(0)
        })).reverse();

        setHistory(formattedLogs.slice(0, 1000));
      } catch (error) {
        console.error("Failed to fetch historical flips:", error);
      } finally {
        setIsHistoryLoading(false);
      }
    }

    fetchPastEvents();
  }, [publicClient]);

  // 5. Shared Settle Logic
  const settleGame = (won: boolean, payout: string, resultText: string, resultIcon: 'heads' | 'tails') => {
    if (coinOutcome) return;
    const resultData = { won, payout, resultText };
    setCoinOutcome(resultIcon);
    setIsFlipping(false);

    // Refetch in background so it doesn't block UI transition
    setTimeout(() => refetchBalance(), 0);
    setTimeout(() => {
      setLastResult(resultData);
      if (won) {
        arcadeAudio?.playWin();
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#00FFFF', '#00BFFF', '#ffffff']
        });
      } else {
        arcadeAudio?.playLoss();
      }
    }, 1200);
  };

  // 6. Immediate Result Parse (from Receipt) - Eliminates Event Lag
  useEffect(() => {
    if (isTxSuccess && receipt && isFlipping) {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: baseFlipABI,
            eventName: 'FlipOutcome',
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'FlipOutcome') {
            const args = decoded.args as any;
            if (args.player.toLowerCase() === address?.toLowerCase()) {
              settleGame(
                args.won,
                formatUnits(args.payout, 18),
                args.result ? "HEADS" : "TAILS",
                args.result ? 'heads' : 'tails'
              );
              break;
            }
          }
        } catch (e) { }
      }
    }
  }, [isTxSuccess, receipt, address, isFlipping]);

  // 7. Watch for Live Events (Global History + Fast Path for Result)
  useWatchContractEvent({
    address: BASEFLIP_ADDRESS,
    abi: baseFlipABI,
    eventName: 'FlipOutcome',
    onLogs(logs) {
      const newFlips: FlipEvent[] = logs.map(log => ({
        player: (log.args as any).player,
        amount: (log.args as any).amount,
        isHeads: (log.args as any).isHeads,
        result: (log.args as any).result,
        won: (log.args as any).won,
        payout: (log.args as any).payout,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber || BigInt(0)
      }));

      setHistory(prev => [...newFlips.reverse(), ...prev].slice(0, 1000));

      // FAST PATH: If the event arrives before the receipt is processed, reveal immediately
      const userLog = newFlips.find(log => log.player.toLowerCase() === address?.toLowerCase());
      if (userLog && isFlipping) {
        settleGame(
          userLog.won,
          formatUnits(userLog.payout, 18),
          userLog.result ? "HEADS" : "TAILS",
          userLog.result ? 'heads' : 'tails'
        );
      }
    },
  });

  const handleAction = async () => {
    if (!isConnected) return;

    if (chain?.id !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
      return;
    }

    const amountInWei = parseEther(betAmount || '0');
    const potentialPayout = (amountInWei * BigInt(197)) / BigInt(100);

    // 1. Check UX Safety Limit (High soft cap)
    if (parseFloat(betAmount) > MAX_BET) {
      alert(`SAFETY LIMIT: MAX ALLOWED IS ${MAX_BET} ETH`);
      return;
    }

    // 2. Check Contract Liquidity
    if (protocolBalance && potentialPayout > protocolBalance.value) {
      alert("CRITICAL: INSUFFICIENT CONTRACT LIQUIDITY FOR THIS PAYOUT.");
      return;
    }

    setLastResult(null);
    setCoinOutcome(null);
    setIsFlipping(true);
    arcadeAudio?.playFlip();

    try {
      writeContract({
        address: BASEFLIP_ADDRESS,
        abi: baseFlipABI,
        functionName: 'flip',
        args: [selectedSide],
        value: amountInWei,
      });
    } catch (err) {
      console.error("Write error:", err);
      setIsFlipping(false);
    }
  };

  const handleWithdraw = async (withdrawAmount: string) => {
    if (!isOwner || !withdrawAmount) return;
    try {
      writeContract({
        address: BASEFLIP_ADDRESS,
        abi: baseFlipABI,
        functionName: 'withdraw',
        args: [parseEther(withdrawAmount)],
      });
    } catch (err) {
      console.error("Withdraw error:", err);
    }
  };

  useEffect(() => {
    if (writeError) {
      setIsFlipping(false);
      (window as any)._minSpinActive = false;
      setCoinOutcome(null);
    }
  }, [writeError]);

  useEffect(() => {
    if (isTxSuccess) {
      refetchBalance();
    }
  }, [isTxSuccess, refetchBalance]);

  const betAmountNum = parseFloat(betAmount);
  const isInvalidAmount = betAmountNum < 0.0006 || isNaN(betAmountNum);
  const isPending = isWritePending || isTxLoading || isFlipping;
  const isLowBalance = ethBalance ? ethBalance.value < parseEther(betAmount || '0') : false;

  const faucets = [
    { name: 'Chainlink Faucet (0.5 ETH)', url: 'https://faucets.chain.link/base-sepolia' },
    { name: 'ETHGlobal Faucet', url: 'https://ethglobal.com/faucet/base-sepolia-84532' },
    { name: 'Alchemy Faucet', url: 'https://www.alchemy.com/faucets/base-sepolia' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-game-bg overflow-x-hidden">
      {/* Header */}
      <div className="mb-12 relative animate-in fade-in slide-in-from-top duration-700">
        <h1 className={`text-4xl md:text-7xl mb-1 tracking-tighter transition-all duration-300 hover:scale-105 cursor-default relative z-10 ${lastResult?.won ? 'glitch-win' : 'neon-glow'}`}>
          BASEFLIP
        </h1>
        <p className="text-[10px] md:text-xs font-arcade text-electric-cyan/40 tracking-[0.4em] mb-4 uppercase">
          LIVE ON BASE TESTNET
        </p>
        <div className="flex items-center justify-center space-x-4">
          <div className={`h-1 w-8 md:w-16 bg-electric-cyan shadow-[0_0_10px_#00FFFF] ${isFlipping ? 'animate-pulse' : ''}`} />
          <p className="text-xl md:text-2xl text-primary-blue animate-pulse font-arcade uppercase">
            {isFlipping ? "FLIPPING..." : "PRESS START"}
          </p>
          <div className={`h-1 w-8 md:w-16 bg-electric-cyan shadow-[0_0_10px_#00FFFF] ${isFlipping ? 'animate-pulse' : ''}`} />
        </div>
      </div>

      {/* Arcade Cabinet */}
      <div className={`retro-panel p-6 md:p-10 max-w-2xl w-full border-4 border-primary-blue relative shadow-[0_0_30px_rgba(0,191,255,0.2)] transition-all duration-300 ${lastResult ? (lastResult.won ? 'border-green-500 shadow-green-500/20' : 'border-red-500 shadow-red-500/20 animate-shake') : ''}`}>
        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-electric-cyan" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-electric-cyan" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-electric-cyan" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-electric-cyan" />

        {!isConnected ? (
          <div className="py-12 space-y-8 animate-in zoom-in duration-500">
            <h2 className="text-xl md:text-2xl mb-6 blue-glow font-arcade animate-pulse">
              INSERT PLAYER ONE
            </h2>
            <div className="flex justify-center scale-110">
              <ConnectButton label="CONNECT WALLET TO START" />
            </div>
            <p className="text-primary-blue/60 text-xs mt-4 uppercase">Sync your wallet to start a new session</p>
          </div>
        ) : (
          <div className="space-y-8 fade-in duration-500">
            {/* Player Info Row */}
            <div className="flex flex-wrap items-center justify-between border-b-2 border-primary-blue/30 pb-4 mb-6 gap-4">
              <div className="text-left">
                <p className="text-[10px] text-primary-blue/60 font-arcade mb-1 uppercase">TOTAL CREDITS</p>
                <p className="text-xl text-electric-cyan font-arcade">
                  {ethBalance ? parseFloat(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(6) : '0.000000'} <span className="text-xs">ETH</span>
                </p>
              </div>
              <div className="text-right flex items-center space-x-4">
                <button
                  onClick={() => setShowFaucetModal(true)}
                  className="p-2 border border-electric-cyan/40 text-electric-cyan/60 hover:text-electric-cyan hover:border-electric-cyan transition-all font-arcade text-[10px] uppercase"
                >
                  REFILL CREDITS
                </button>
                <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
              </div>
            </div>

            {/* Betting Controls */}
            <div className={`space-y-6 transition-all duration-500 ${isFlipping ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
              {/* Visual Coin Space */}
              <CoinFlipAnimation isFlipping={isFlipping} outcome={coinOutcome} />

              <CoinSelector
                selectedSide={selectedSide}
                setSelectedSide={setSelectedSide}
              />

              <BetInput
                amount={betAmount}
                setAmount={setBetAmount}
                minBet={0.0006}
                maxBet={MAX_BET}
              />

              <div className="space-y-4">
                <FlipButton
                  onClick={handleAction}
                  isLoading={isPending}
                  disabled={isInvalidAmount || (isLowBalance && !isPending)}
                >
                  {isLowBalance && !isPending ? "INSUFFICIENT ETH" : "FLIP NOW!"}
                </FlipButton>

                {isLowBalance && (
                  <div className="animate-pulse">
                    <button
                      onClick={() => setShowFaucetModal(true)}
                      className="text-[10px] font-arcade text-red-400 hover:text-electric-cyan transition-colors uppercase tracking-widest"
                    >
                      &gt; OUT OF ETH? GET MORE HERE &lt;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {lastResult && (
              <div className={`mt-6 p-6 border-4 animate-in zoom-in duration-300 relative overflow-hidden ${lastResult.won ? 'border-green-500 bg-green-500/10 glitch-win' : 'border-red-500 bg-red-500/10 glitch-loss'}`}>
                <h3 className={`font-arcade text-xl mb-2 ${lastResult.won ? 'text-green-400' : 'text-red-400'}`}>
                  {lastResult.won ? 'JACKPOT!' : 'BUSTED!'}
                </h3>
                <p className="text-sm font-arcade uppercase mb-4">
                  FINAL OUTCOME: <span className="text-white">{lastResult.resultText}</span>
                </p>
                {lastResult.won && (
                  <div className="relative">
                    <span className="text-3xl text-green-400 font-arcade neon-glow block">
                      WIN! +{parseFloat(lastResult.payout).toFixed(6)} ETH
                    </span>
                    <div className="absolute -inset-1 bg-green-400/20 blur-xl animate-pulse" />
                  </div>
                )}
                {!lastResult.won && (
                  <span className="text-2xl text-red-400 font-arcade block">
                    LOSE – -{parseFloat(betAmount).toFixed(6)} ETH
                  </span>
                )}
              </div>
            )}

            {/* System Log */}
            <div className="bg-black/40 border-2 border-primary-blue/20 p-4 font-retro text-left overflow-hidden">
              <p className="text-[10px] text-primary-blue/60 mb-2 font-arcade uppercase">TERMINAL STATUS: ONLINE</p>
              <div className="text-xs text-primary-blue/80 space-y-1">
                <p>&gt; PLAYER ID: {address?.slice(0, 10)}...</p>
                {isWritePending && <p className="text-yellow-400 animate-pulse">&gt; AUTHORIZING NEURAL LINK (WALLET)...</p>}
                {isTxLoading && <p className="text-electric-cyan animate-pulse">&gt; TX DISPATCHED. WAITING FOR BLOCK...</p>}
                {isFlipping && !isWritePending && !isTxLoading && <p className="text-electric-cyan animate-pulse">&gt; CALCULATING RESULT...</p>}
                {lastResult?.won && <p className="text-green-400">&gt; PAYOUT DISPENSED SUCCESSFULLY</p>}
                {lastResult && !lastResult.won && <p className="text-red-400">&gt; BET CLAIMED BY HOUSE.</p>}
                {isLowBalance && !isPending && <p className="text-red-400 animate-pulse">&gt; ALERT: INSUFFICIENT LIQUID ASSETS</p>}
                {!isFlipping && !lastResult && !isLowBalance && <p>&gt; STANDING BY FOR NEXT BET...</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Faucet Modal */}
      {showFaucetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="retro-panel p-8 max-w-md w-full border-4 border-electric-cyan bg-navy/90 relative shadow-[0_0_50px_rgba(0,255,255,0.3)]">
            <button
              onClick={() => setShowFaucetModal(false)}
              className="absolute top-4 right-4 text-electric-cyan hover:text-white font-arcade text-xl"
            >
              X
            </button>
            <h2 className="text-2xl font-arcade text-electric-cyan mb-6 neon-glow uppercase">TEST ETH FAUCETS</h2>
            <p className="text-sm font-retro text-primary-blue/80 mb-8 uppercase leading-relaxed text-left">
              &gt; Refill your credits via these verified gateways:
            </p>
            <div className="space-y-4">
              {faucets.map((faucet) => (
                <a
                  key={faucet.name}
                  href={faucet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border-2 border-primary-blue/30 bg-black/40 hover:border-electric-cyan hover:bg-electric-cyan/10 transition-all font-arcade text-xs text-left text-white group"
                >
                  <span className="text-electric-cyan group-hover:animate-pulse mr-2">&gt;</span>
                  {faucet.name.toUpperCase()}
                </a>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-primary-blue/20">
              <button
                onClick={() => setShowFaucetModal(false)}
                className="w-full py-3 border-2 border-primary-blue text-primary-blue font-arcade text-xs hover:bg-primary-blue/20 transition-all uppercase"
              >
                CLOSE TERMINAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Sections */}
      <div className="w-full flex flex-col items-center">
        <HallOfFame history={history} />
        <RecentFlips history={history.slice(0, 20)} isLoading={isHistoryLoading} />
      </div>

      {/* HIDDEN ADMIN DASHBOARD - Only visible to Owner */}
      {isOwner && (
        <div className="mt-20 w-full max-w-2xl animate-in slide-in-from-bottom duration-1000 border-t-2 border-dashed border-yellow-500/20 pt-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
            <h2 className="text-yellow-500 font-arcade text-sm tracking-[0.3em] uppercase">
              ROOT ACCESS: PROTOCOL MANAGEMENT
            </h2>
          </div>

          <div className="retro-panel bg-yellow-900/10 border-2 border-yellow-500/40 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-left space-y-4">
              <div>
                <p className="text-[10px] text-yellow-500/60 font-arcade uppercase mb-1">CONTRACT VAULT</p>
                <p className="text-xl font-arcade text-white">
                  {protocolBalance ? parseFloat(formatUnits(protocolBalance.value, 18)).toFixed(4) : "0.0000"} <span className="text-xs text-yellow-500">ETH</span>
                </p>
              </div>
              <div className="pt-2">
                <p className="text-[10px] text-yellow-500/60 font-arcade uppercase mb-2">QUICK ACTIONS</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleWithdraw("0.05")}
                    className="py-2 border border-yellow-500/40 text-yellow-500/60 font-arcade text-[8px] hover:bg-yellow-500/20 hover:text-yellow-500 transition-all uppercase"
                  >
                    HARVEST 0.05
                  </button>
                  <button
                    onClick={() => handleWithdraw("0.1")}
                    className="py-2 border border-yellow-500/40 text-yellow-500/60 font-arcade text-[8px] hover:bg-yellow-500/20 hover:text-yellow-500 transition-all uppercase"
                  >
                    HARVEST 0.10
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] text-yellow-500/60 font-arcade uppercase mb-2">CUSTOM EXTRACTION (ETH)</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customWithdrawAmount}
                    onChange={(e) => setCustomWithdrawAmount(e.target.value)}
                    className="flex-1 bg-black/40 border border-yellow-500/20 p-2 text-yellow-500 font-arcade text-[10px] outline-none focus:border-yellow-500/60"
                    placeholder="AMOUNT"
                  />
                  <button
                    onClick={() => handleWithdraw(customWithdrawAmount)}
                    className="px-4 py-2 border-2 border-yellow-500 text-yellow-500 font-arcade text-[8px] hover:bg-yellow-500 hover:text-black transition-all uppercase"
                  >
                    EXTRACT
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-black/60 border border-yellow-500/20 p-4 font-retro text-[10px] text-yellow-500/80 space-y-2">
              <p>&gt; AUTH_LEVEL: SUPERUSER</p>
              <p>&gt; STATUS: SECURE_LINK_ACTIVE</p>
              <p>&gt; MAX_EXPOSURE: {MAX_BET} ETH</p>
              <p className="pt-2 animate-pulse">&gt; STANDING BY FOR COMMANDS...</p>
            </div>
          </div>
          <p className="mt-4 text-[8px] text-yellow-500/30 font-arcade uppercase tracking-widest text-center">
            * THIS PANEL IS INVISIBLE TO EXTERNAL PLAYERS *
          </p>
        </div>
      )}

      <footer className="mt-12 text-[10px] md:text-xs tracking-widest opacity-40 uppercase space-y-2 max-w-sm">
        <p>COIN FLIP – BET ETH, 50/50 CHANCE, 1.5% HOUSE EDGE | NETWORK: BASE_SEPOLIA</p>
        <p className="pt-4">© BaseFlip 2026</p>
      </footer>
    </div>
  );
}
