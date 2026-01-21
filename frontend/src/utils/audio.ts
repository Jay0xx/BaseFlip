'use client';

class ArcadeAudio {
    private ctx: AudioContext | null = null;

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    playWin() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Simple 3-note upbeat sequence
        this.playNote(440, now, 0.1);    // A4
        this.playNote(554.37, now + 0.1, 0.1); // C#5
        this.playNote(659.25, now + 0.2, 0.3); // E5
    }

    playLoss() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Descending low buzz
        this.playNote(220, now, 0.2, 'sawtooth');
        this.playNote(110, now + 0.15, 0.4, 'sawtooth');
    }

    playFlip() {
        this.init();
        if (!this.ctx) return;
        this.playNote(880, this.ctx.currentTime, 0.05, 'square');
    }

    private playNote(freq: number, start: number, duration: number, type: OscillatorType = 'square') {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, start + duration);

        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
    }
}

export const arcadeAudio = typeof window !== 'undefined' ? new ArcadeAudio() : null;
