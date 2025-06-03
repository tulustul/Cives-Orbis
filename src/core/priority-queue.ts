interface QueueNode<T> {
  item: T;
  priority: number;
}

export class PriorityQueue<T> {
  private heap: QueueNode<T>[] = [];

  get size(): number {
    return this.heap.length;
  }

  get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  push(item: T, priority: number): void {
    const node: QueueNode<T> = { item, priority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | null {
    if (this.isEmpty) {
      return null;
    }

    if (this.heap.length === 1) {
      return this.heap.pop()!.item;
    }

    const top = this.heap[0].item;
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return top;
  }

  peek(): T | null {
    return this.isEmpty ? null : this.heap[0].item;
  }

  clear(): void {
    this.heap.length = 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      
      if (this.heap[index].priority >= this.heap[parentIndex].priority) {
        break;
      }

      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }

      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }

      if (smallest === index) {
        break;
      }

      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}