'use client';

import React from 'react';

interface CoinFlipAnimationProps {
    isFlipping: boolean;
    outcome: 'heads' | 'tails' | null;
}

export default function CoinFlipAnimation({ isFlipping, outcome }: CoinFlipAnimationProps) {
    return (
        <div className="coin-container">
            {/* Scanlines Overlay - visible during flip */}
            <div className={`scanlines ${isFlipping ? 'active' : ''}`} />

            {/* 
                - pixel-spin: Continuous linear loop while waiting
                - revealing: Final smooth settle into position
            */}
            <div className={`coin ${isFlipping ? 'pixel-spin' : ''} ${outcome ? 'revealing ' + outcome : ''}`}>
                <div className="side heads">
                    <div className="pixel-pattern" />
                    <span className="coin-text">HEADS</span>
                </div>
                <div className="side tails">
                    <div className="pixel-pattern" />
                    <span className="coin-text">TAILS</span>
                </div>
            </div>

            <style jsx>{`
                .coin-container {
                    perspective: 1200px;
                    width: 200px;
                    height: 200px;
                    margin: 2rem auto;
                    position: relative;
                }
                
                .coin {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    image-rendering: pixelated;
                }

                .side {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    clip-path: polygon(
                        20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%
                    );
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Press Start 2P', cursive;
                    border: 8px solid #000;
                    overflow: hidden;
                }

                .pixel-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
                        linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
                        linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%);
                    background-size: 8px 8px;
                    background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
                    pointer-events: none;
                }

                .heads {
                    background-color: #00ffff;
                    color: #fff;
                    transform: rotateY(0deg);
                }

                .tails {
                    background-color: #ff00ff;
                    color: #fff;
                    transform: rotateY(180deg);
                }

                .coin-text {
                    font-size: 1.4rem;
                    letter-spacing: 4px;
                    z-index: 10;
                    text-shadow: 
                        -4px -4px 0 #000,  
                         4px -4px 0 #000,
                        -4px  4px 0 #000,
                         4px  4px 0 #000,
                         0px  4px 0 #000,
                         0px -4px 0 #000,
                         4px  0px 0 #000,
                        -4px  0px 0 #000;
                }

                /* Continuous linear spin while isFlipping is true */
                .pixel-spin {
                    animation: loop-spin 0.4s linear infinite;
                }

                @keyframes loop-spin {
                    0%   { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }

                /* Final "High Stakes" Reveal Animation */
                .coin.heads.revealing {
                    animation: settle-reveal-heads 1.2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
                }

                .coin.tails.revealing {
                    animation: settle-reveal-tails 1.2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
                }

                @keyframes settle-reveal-heads {
                    0%   { transform: rotateY(0deg); }
                    100% { transform: rotateY(1440deg); }
                }

                @keyframes settle-reveal-tails {
                    0%   { transform: rotateY(0deg); }
                    100% { transform: rotateY(1620deg); } /* 1440 + 180 for tails */
                }

                /* Outcome override after reveal settle */
                .coin.heads:not(.pixel-spin):not(.revealing) { 
                    transform: rotateY(0deg) scale(1.05); 
                }
                
                .coin.tails:not(.pixel-spin):not(.revealing) { 
                    transform: rotateY(180deg) scale(1.05);
                }

                /* CRT Scanlines Layer */
                .scanlines {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        rgba(18, 16, 16, 0) 50%,
                        rgba(0, 0, 0, 0.2) 50%
                    ), linear-gradient(
                        90deg,
                        rgba(255, 0, 0, 0.05),
                        rgba(0, 255, 0, 0.02),
                        rgba(0, 0, 255, 0.05)
                    );
                    background-size: 100% 4px, 6px 100%;
                    z-index: 20;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                
                .scanlines.active {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
