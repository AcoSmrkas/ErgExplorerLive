// src/lib/utils/TransactionManager.ts
import { audioManager } from './AudioManager';
import { get, writable } from 'svelte/store';

export type SoundType = 'sigusd' | 'p2p' | 'dex' | 'mixer' | null;

export type TransactionQueueItem = {
    transaction: any;
    soundType: SoundType;
    label?: string;
    style?: string;
};

class TransactionManager {
    private static instance: TransactionManager;
    private queue: TransactionQueueItem[] = [];
    private isProcessing = false;
    private transactionDelay = 500; // Reduced delay to 500ms
    public displayedTransactions = writable<any[]>([]);
    public isPaused = writable<boolean>(false);
    private maxDisplayed = 50; // Maximum number of transactions to keep in display
    private processedTransactionIds = new Set<string>(); // Track processed transaction IDs

    private constructor() {
        // Initialize empty state
        this.displayedTransactions.set([]);
        this.isPaused.set(false);
    }

    static getInstance(): TransactionManager {
        if (!TransactionManager.instance) {
            TransactionManager.instance = new TransactionManager();
        }
        return TransactionManager.instance;
    }

    setDelay(delay: number) {
        this.transactionDelay = delay;
    }

    getDelay(): number {
        return this.transactionDelay;
    }

    pauseProcessing() {
        this.isPaused.set(true);
        this.isProcessing = false;
    }

    resumeProcessing() {
        this.isPaused.set(false);
        if (this.queue.length > 0) {
            this.processQueue();
        }
    }

    async addTransaction(
        transaction: any, 
        soundType: SoundType = null, 
        label?: string, 
        style?: string
    ) {
        // Check if this transaction has already been processed
        if (this.processedTransactionIds.has(transaction.id)) {
            console.log('Transaction already processed:', transaction.id);
            return;
        }

        console.log('Adding transaction to queue:', { 
            transactionId: transaction.id,
            soundType,
            label,
            style,
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            isPaused: get(this.isPaused)
        });

        this.queue.push({ 
            transaction, 
            soundType,
            label,
            style
        });

        // Only start processing if not already processing
        if (!this.isProcessing && !get(this.isPaused)) {
            console.log('Starting queue processing');
            this.processQueue();
        }
    }

    async addTransactions(transactions: Array<TransactionQueueItem>) {
        transactions.forEach(tx => this.addTransaction(
            tx.transaction, 
            tx.soundType, 
            tx.label, 
            tx.style
        ));
    }

    private async processQueue() {
        console.log('Processing queue', {
            queueLength: this.queue.length,
            isPaused: get(this.isPaused)
        });

        // Stop processing if queue is empty
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        if (get(this.isPaused)) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const { transaction, soundType, label, style } = this.queue.shift()!;

        // Mark transaction as processed
        this.processedTransactionIds.add(transaction.id);

        console.log('Processing transaction:', { 
            id: transaction.id, 
            soundType, 
            label 
        });

        // Add transaction to displayed transactions with limit
        this.displayedTransactions.update(txs => {
            const newTxs = [...txs, transaction];
            if (newTxs.length > this.maxDisplayed) {
                return newTxs.slice(-this.maxDisplayed);
            }
            return newTxs;
        });

        // Dispatch event for new transaction
        window.dispatchEvent(new CustomEvent('transactionDisplayed', {
            detail: { 
                transaction,
                label,
                style
            }
        }));

        // Play sound if specified
        if (soundType) {
            try {
                await audioManager.playSound(soundType);
            } catch (error) {
                console.error('Error playing sound:', error);
            }
        }

        // Wait before processing next transaction
        await new Promise(resolve => setTimeout(resolve, this.transactionDelay));
        
        // Continue processing if not paused
        if (!get(this.isPaused)) {
            this.processQueue();
        } else {
            this.isProcessing = false;
        }
    }

    clearQueue() {
        this.queue = [];
        this.processedTransactionIds.clear();
        this.isProcessing = false;
        this.displayedTransactions.set([]);
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    getDisplayedTransactions() {
        return get(this.displayedTransactions);
    }

    setMaxDisplayed(max: number) {
        this.maxDisplayed = max;
        // Trim existing displayed transactions if needed
        this.displayedTransactions.update(txs => {
            if (txs.length > max) {
                return txs.slice(-max);
            }
            return txs;
        });
    }

    // Method to check if a transaction has been processed
    hasBeenProcessed(transactionId: string): boolean {
        return this.processedTransactionIds.has(transactionId);
    }
}

export const transactionManager = TransactionManager.getInstance();