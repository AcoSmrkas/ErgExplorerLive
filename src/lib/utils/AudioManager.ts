// src/lib/utils/AudioManager.ts
class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext | null = null;
    private sounds: Map<string, AudioBuffer> = new Map();
    private isInitialized = false;
    private isUserInteracted = false;

    private constructor() {
        // Add event listeners for user interactions
        this.addUserInteractionListeners();
    }

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private addUserInteractionListeners() {
        const events = ['click', 'touchstart', 'keydown'];
        
        const initializeAudio = () => {
            if (!this.isUserInteracted) {
                this.isUserInteracted = true;
                this.initialize().catch(console.error);
                
                // Remove event listeners after first interaction
                events.forEach(event => {
                    document.removeEventListener(event, initializeAudio);
                });
            }
        };

        // Add listeners to document
        events.forEach(event => {
            document.addEventListener(event, initializeAudio, { once: false });
        });
    }

    async initialize() {
        if (this.isInitialized) return;
       
        try {
            // Create AudioContext only after user interaction
            this.audioContext = new AudioContext();
           
            // Create different beep sounds
            await this.createBeeps();
           
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
        }
    }

    private async createBeeps() {
        if (!this.audioContext) return;
        
        // Tiny beep for small transactions
        const tinyBeep = await this.createBeepBuffer(0.1, 660); // Very short beep
        this.sounds.set('tiny', tinyBeep);

        // Long beep for SigUSD (2 beeps)
        const sigusdBeep = await this.createMultipleBeeps([
            { duration: 0.2, frequency: 880 },
            { duration: 0.2, frequency: 880 }
        ]);
        this.sounds.set('sigusd', sigusdBeep);
        
        // DEX sound (3 quick beeps)
        const dexBeep = await this.createMultipleBeeps([
            { duration: 0.1, frequency: 880 },
            { duration: 0.1, frequency: 660 },
            { duration: 0.1, frequency: 440 }
        ]);
        this.sounds.set('dex', dexBeep);
        
        // Rosen Bridge (4 beeps)
        const rosenBeep = await this.createMultipleBeeps([
            { duration: 0.1, frequency: 440 },
            { duration: 0.1, frequency: 660 },
            { duration: 0.1, frequency: 880 },
            { duration: 0.1, frequency: 1100 }
        ]);
        this.sounds.set('rosen', rosenBeep);

        // P2P sound
        const p2pBeep = await this.createBeepBuffer(0.2, 660);
        this.sounds.set('p2p', p2pBeep);
        
        // Mixer sound
        const mixerBeep = await this.createMultipleBeeps([
            { duration: 0.1, frequency: 440 },
            { duration: 0.1, frequency: 880 }
        ]);
        this.sounds.set('mixer', mixerBeep);
    }

    private async createBeepBuffer(duration: number, frequency: number): Promise<AudioBuffer> {
        if (!this.audioContext) throw new Error('AudioContext not initialized');
        
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            // Sine wave with exponential decay
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-4 * t);
        }
        
        return buffer;
    }

    private async createMultipleBeeps(beeps: Array<{ duration: number, frequency: number }>): Promise<AudioBuffer> {
        if (!this.audioContext) throw new Error('AudioContext not initialized');
        
        const totalDuration = beeps.reduce((sum, beep) => sum + beep.duration, 0);
        const buffer = this.audioContext.createBuffer(
            1,
            totalDuration * this.audioContext.sampleRate,
            this.audioContext.sampleRate
        );
        const data = buffer.getChannelData(0);
        
        let currentSample = 0;
        for (const beep of beeps) {
            const numSamples = beep.duration * this.audioContext.sampleRate;
            for (let i = 0; i < numSamples; i++) {
                const t = i / this.audioContext.sampleRate;
                data[currentSample + i] = Math.sin(2 * Math.PI * beep.frequency * t) * Math.exp(-4 * t);
            }
            currentSample += numSamples;
        }
        
        return buffer;
    }

    async playSound(type: 'sigusd' | 'p2p' | 'dex' | 'mixer' | 'tiny' | 'rosen' | null) {
        // Ensure audio context is initialized
        if (!this.audioContext || !this.isInitialized) {
            try {
                await this.initialize();
            } catch (error) {
                console.error('Failed to initialize audio before playing:', error);
                return;
            }
        }

        // If no sound type or sound not found, return
        if (!type) return;

        const sound = this.sounds.get(type);
        if (!sound || !this.audioContext) return;

        try {
            // Resume AudioContext if it's suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = sound;
            source.connect(this.audioContext.destination);
            source.start();
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
}

export const audioManager = AudioManager.getInstance();