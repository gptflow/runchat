type QueueItem<T> = {
    value: T | null;
    error?: Error;
};
export declare class AsyncQueue<T> {
    private storage;
    private waitingResolvers;
    push(item: QueueItem<T>): void;
    [Symbol.asyncIterator](): AsyncIterableIterator<T>;
}
export {};
