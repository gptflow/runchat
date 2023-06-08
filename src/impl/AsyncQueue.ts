type QueueItem<T> = {
  value: T | null;
  error?: Error;
};

export class AsyncQueue<T> {
  private storage: QueueItem<T>[] = [];
  private waitingResolvers: ((item: QueueItem<T>) => void)[] = [];

  // Push method
  push(item: QueueItem<T>): void {
    if (this.waitingResolvers.length > 0) {
      const resolver = this.waitingResolvers.shift();
      resolver?.(item);
    } else {
      this.storage.push(item);
    }
  }

  // Async iterable interface
  async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
    while (true) {
      let item;
      if (this.storage.length > 0) {
        item = this.storage.shift();
      } else {
        item = await new Promise<QueueItem<T>>((resolve) => {
          this.waitingResolvers.push(resolve);
        });
      }

      // If item error is not null, throw the error
      if (item?.error) {
        throw item.error;
      }

      // If item value is null, finish the iteration
      if (item?.value === null) {
        return;
      }

      // Yield the value
      yield item!.value;
    }
  }
}
