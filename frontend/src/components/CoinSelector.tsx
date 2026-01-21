'use client';

interface CoinSelectorProps {
    selectedSide: boolean; // true for Heads, false for Tails
    setSelectedSide: (side: boolean) => void;
}

export default function CoinSelector({ selectedSide, setSelectedSide }: CoinSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <button
                onClick={() => setSelectedSide(true)}
                className={`p-4 border-4 transition-all duration-200 font-arcade text-xs md:text-sm ${selectedSide
                        ? 'bg-primary-blue/20 border-electric-cyan text-electric-cyan shadow-[0_0_20px_rgba(0,255,255,0.4)]'
                        : 'bg-navy/40 border-primary-blue/40 text-primary-blue/60 hover:border-primary-blue hover:text-primary-blue'
                    }`}
            >
                <div className="mb-2">HEADS</div>
                <div className={`w-12 h-12 mx-auto rounded-full border-2 transition-all ${selectedSide ? 'border-electric-cyan bg-electric-cyan/20 animate-pulse' : 'border-primary-blue/20'
                    }`}>
                    <div className={`w-full h-full flex items-center justify-center font-arcade text-lg ${selectedSide ? 'text-electric-cyan italic' : 'text-primary-blue/20'}`}>
                        H
                    </div>
                </div>
            </button>

            <button
                onClick={() => setSelectedSide(false)}
                className={`p-4 border-4 transition-all duration-200 font-arcade text-xs md:text-sm ${!selectedSide
                        ? 'bg-primary-blue/20 border-electric-cyan text-electric-cyan shadow-[0_0_20px_rgba(0,255,255,0.4)]'
                        : 'bg-navy/40 border-primary-blue/40 text-primary-blue/60 hover:border-primary-blue hover:text-primary-blue'
                    }`}
            >
                <div className="mb-2">TAILS</div>
                <div className={`w-12 h-12 mx-auto rounded-full border-2 transition-all ${!selectedSide ? 'border-electric-cyan bg-electric-cyan/20 animate-pulse' : 'border-primary-blue/20'
                    }`}>
                    <div className={`w-full h-full flex items-center justify-center font-arcade text-lg ${!selectedSide ? 'text-electric-cyan italic' : 'text-primary-blue/20'}`}>
                        T
                    </div>
                </div>
            </button>
        </div>
    );
}
