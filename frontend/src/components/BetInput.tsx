'use client';

interface BetInputProps {
    amount: string;
    setAmount: (amount: string) => void;
    minBet?: number;
    maxBet?: number;
}

export default function BetInput({
    amount,
    setAmount,
    minBet = 0.0006,
    maxBet = 0.1
}: BetInputProps) {

    // Sanitize input to prevent negative or non-numeric values
    const handleChange = (val: string) => {
        const numericValue = val.replace(/[^0-9.]/g, '');
        setAmount(numericValue);
    };

    const handleIncrement = () => {
        const current = parseFloat(amount) || 0;
        if (current + 0.001 <= maxBet) {
            setAmount((current + 0.001).toFixed(4));
        } else {
            setAmount(maxBet.toString());
        }
    };

    const handleDecrement = () => {
        const current = parseFloat(amount) || 0;
        if (current > minBet + 0.0001) {
            setAmount((current - 0.001).toFixed(4));
        } else {
            setAmount(minBet.toString());
        }
    };

    const isInvalid = (parseFloat(amount) < minBet) || (parseFloat(amount) > maxBet);

    return (
        <div className={`w-full mb-8 bg-navy/40 p-4 border-2 relative transition-colors duration-300 ${isInvalid ? 'border-red-500/50' : 'border-primary-blue/30'}`}>
            <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-arcade text-primary-blue tracking-widest text-left uppercase">
                    COIN STAKE (ETH)
                </label>
            </div>

            <div className="flex items-center space-x-4">
                <button
                    onClick={handleDecrement}
                    className="w-12 h-12 border-2 border-electric-cyan text-electric-cyan font-arcade text-xl flex items-center justify-center hover:bg-electric-cyan/20 active:scale-95 transition-all outline-none"
                    type="button"
                >
                    -
                </button>

                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => handleChange(e.target.value)}
                        className={`w-full bg-black/60 border-2 p-3 text-center text-2xl font-arcade outline-none transition-all ${isInvalid ? 'border-red-500 text-red-500' : 'border-primary-blue text-electric-cyan focus:border-electric-cyan focus:shadow-[0_0_10px_rgba(0,255,255,0.2)]'}`}
                        placeholder="0.0006"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-blue/40 font-arcade text-[10px] pointer-events-none">
                        ETH
                    </div>
                </div>

                <button
                    onClick={handleIncrement}
                    className="w-12 h-12 border-2 border-electric-cyan text-electric-cyan font-arcade text-xl flex items-center justify-center hover:bg-electric-cyan/20 active:scale-95 transition-all outline-none"
                    type="button"
                >
                    +
                </button>
            </div>

            <div className="mt-4 flex justify-between text-[10px] font-arcade text-primary-blue/60 uppercase">
                <span>MIN: {minBet} ETH | MAX: NO LIMIT</span>
                <span className={`${isInvalid ? 'text-red-400' : 'text-green-500/60'} animate-pulse`}>
                    {isInvalid ? 'INVALID STAKE' : 'SECURE CONNECTION'}
                </span>
            </div>
        </div>
    );
}
