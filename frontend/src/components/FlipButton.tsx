'use client';

interface FlipButtonProps {
    onClick: () => void;
    isLoading: boolean;
    disabled: boolean;
    children?: React.ReactNode;
}

export default function FlipButton({ onClick, isLoading, disabled, children }: FlipButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`w-full py-6 font-arcade text-xl transition-all duration-300 relative group overflow-hidden ${disabled || isLoading
                    ? 'bg-navy/60 border-4 border-primary-blue/20 text-primary-blue/20 cursor-not-allowed'
                    : 'bg-primary-blue border-4 border-electric-cyan text-white shadow-[0_0_15px_rgba(0,191,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] hover:scale-[1.02] active:scale-95'
                }`}
        >
            <div className="relative z-10 flex items-center justify-center space-x-4">
                {isLoading ? (
                    <div className="flex items-center space-x-2">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce [animation-delay:0.2s]">.</span>
                        <span className="animate-bounce [animation-delay:0.4s]">.</span>
                        <span className="ml-2 uppercase">{children?.toString().includes("APPROVE") ? "APPROVING" : "FLIPPING"}</span>
                    </div>
                ) : (
                    <>
                        <span className="group-hover:animate-ping inline-block">🚀</span>
                        <span className="neon-glow uppercase">{children || "FLIP NOW!"}</span>
                        <span className="group-hover:animate-ping inline-block shadow-white">🚀</span>
                    </>
                )}
            </div>

            {/* Glitch Overlay on Hover */}
            {!disabled && !isLoading && (
                <div className="absolute inset-0 bg-electric-cyan/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300 skew-x-12" />
            )}
        </button>
    );
}
