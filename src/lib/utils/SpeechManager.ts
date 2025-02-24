// SpeechManager.ts
class SpeechManager {
    private static instance: SpeechManager;
    private synthesis: SpeechSynthesis;
    private isInitialized = false;
    private preferredVoice: SpeechSynthesisVoice | null = null;
    private isSpeaking = false;

    private constructor() {
        this.synthesis = window.speechSynthesis;
    }

    static getInstance(): SpeechManager {
        if (!SpeechManager.instance) {
            SpeechManager.instance = new SpeechManager();
        }
        return SpeechManager.instance;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            await new Promise<void>((resolve) => {
                if (this.synthesis.getVoices().length > 0) {
                    resolve();
                } else {
                    this.synthesis.onvoiceschanged = () => resolve();
                }
            });

            const voices = this.synthesis.getVoices();
            this.preferredVoice = voices.find(voice => 
                voice.lang.includes('en-US') || voice.lang.includes('en-GB')
            ) || voices[0];

            this.isInitialized = true;
        } catch (error) {
            console.error('Speech synthesis initialization error:', error);
        }
    }

    async speak(text: string, priority: boolean = false) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            if (priority || this.isSpeaking) {
                this.synthesis.cancel();
            }

            this.isSpeaking = true;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.preferredVoice;
            utterance.rate = 1.1;
            utterance.pitch = 1;
            utterance.volume = 1.0;

            this.synthesis.speak(utterance);

            return new Promise((resolve) => {
                utterance.onend = () => {
                    this.isSpeaking = false;
                    resolve(true);
                };
                utterance.onerror = () => {
                    this.isSpeaking = false;
                    resolve(false);
                };
            });
        } catch (error) {
            console.error('Speech error:', error);
            this.isSpeaking = false;
            return false;
        }
    }

    stop() {
        this.synthesis.cancel();
        this.isSpeaking = false;
    }

    isReady() {
        return this.isInitialized;
    }
}

export const speechManager = SpeechManager.getInstance();