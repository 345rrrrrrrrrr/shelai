// Command queue manager for concurrent execution
class CommandQueue {
  private runningCommands: Set<number> = new Set();
  private maxConcurrent: number = 5; // Limit concurrent commands

  async execute<T>(commandId: number, task: () => Promise<T>): Promise<T> {
    // Wait if we're at max capacity
    while (this.runningCommands.size >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.runningCommands.add(commandId);
    
    try {
      const result = await task();
      return result;
    } finally {
      this.runningCommands.delete(commandId);
    }
  }

  getRunningCount(): number {
    return this.runningCommands.size;
  }

  getRunningCommands(): number[] {
    return Array.from(this.runningCommands);
  }
}

export const commandQueue = new CommandQueue();