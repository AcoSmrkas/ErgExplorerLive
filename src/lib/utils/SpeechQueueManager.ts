// SpeechQueueManager.ts
import { speechManager } from './SpeechManager';

class SpeechQueueManager {
    private static instance: SpeechQueueManager;
    private queue: string[] = [];
    private isProcessing = false;

    private constructor() {}

    static getInstance(): SpeechQueueManager {
        if (!SpeechQueueManager.instance) {
            SpeechQueueManager.instance = new SpeechQueueManager();
        }
        return SpeechQueueManager.instance;
    }

    async addToQueue(text: string) {
        this.queue.push(text);
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }

    private async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const text = this.queue.shift();

        try {
            if (text) {
                await speechManager.speak(text);
                // Add a small delay between speeches
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            await this.processQueue();
        } catch (error) {
            console.error('Error processing speech queue:', error);
            this.processQueue();
        }
    }

    clearQueue() {
        this.queue = [];
        this.isProcessing = false;
        speechManager.stop();
    }
}

export const speechQueueManager = SpeechQueueManager.getInstance();