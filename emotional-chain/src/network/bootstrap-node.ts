import { EmotionalChain } from '../blockchain/EmotionalChain';
import { EmotionalNetwork } from './EmotionalNetwork';

class BootstrapNode {
  private blockchain: EmotionalChain;
  private network: EmotionalNetwork;
  private port: number;
  private statsInterval: NodeJS.Timeout | null = null;
  private isShuttingDown: boolean = false;

  constructor(port: number = 8000) {
    this.port = port;
    this.blockchain = new EmotionalChain();
    this.network = new EmotionalNetwork(this.blockchain, `bootstrap_${port}`, port);
    this.setupShutdownHandlers();
  }

  public async start(): Promise<void> {
    try {
      console.log(`Bootstrap node starting on port ${this.port}`);
      console.log('Network already initialized and listening');
      console.log('Waiting for peer connections...');
      this.startStatsMonitoring();
      console.log(`Bootstrap node fully operational on port ${this.port}`);
    } catch (error) {
      console.error('Failed to start bootstrap node:', error);
      await this.shutdown();
      throw error;
    }
  }

  private startStatsMonitoring(): void {
    this.statsInterval = setInterval(() => {
      if (this.isShuttingDown) {
        return;
      }
      
      try {
        if (!this.network) {
          console.warn('Network instance not available');
          return;
        }
        
        const stats = this.network.getNetworkStats();
        
        if (!stats) {
          console.warn('No network stats available');
          return;
        }
        
        const { connectedPeers = 0, activeValidators = 0 } = stats;
        console.log(`Connected peers: ${connectedPeers}, Validators: ${activeValidators}`);
        
        if (connectedPeers === 0) {
          console.log('No peers connected - bootstrap node ready for connections');
        }
        
        if (activeValidators > 0 && connectedPeers === 0) {
          console.warn('Validators active but no peers connected - potential issue');
        }
        
      } catch (error) {
        console.error('Error getting network stats:', error);
      }
    }, 30000);
  }

  private setupShutdownHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}, initiating graceful shutdown...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      await this.shutdown();
      process.exit(1);
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      await this.shutdown();
      process.exit(1);
    });
  }

  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    console.log('Shutting down bootstrap node...');
    
    try {
      if (this.statsInterval) {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
        console.log('Stats monitoring stopped');
      }
      
      if (this.network && typeof this.network.stop === 'function') {
        await this.network.stop();
        console.log('Network shutdown complete');
      } else if (this.network && typeof this.network.shutdown === 'function') {
        await this.network.shutdown();
        console.log('Network shutdown complete');
      }
      
      if (this.blockchain && typeof this.blockchain.shutdown === 'function') {
        await this.blockchain.shutdown();
        console.log('Blockchain cleanup complete');
      }
      
      console.log('Bootstrap node shutdown complete');
      
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  public getStatus(): object {
    try {
      const networkStats = this.network?.getNetworkStats() || { connectedPeers: 0, activeValidators: 0 };
      return {
        port: this.port,
        isRunning: !this.isShuttingDown,
        networkStats,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
    } catch (error) {
      return {
        port: this.port,
        isRunning: !this.isShuttingDown,
        error: error.message
      };
    }
  }
}

async function main() {
  try {
    const portArg = process.argv[2];
    const port = portArg ? parseInt(portArg) : 8000;
    
    if (isNaN(port) || port < 1024 || port > 65535) {
      throw new Error(`Invalid port: ${portArg}. Port must be between 1024 and 65535`);
    }
    
    console.log(`Initializing bootstrap node on port ${port}...`);
    
    const bootstrap = new BootstrapNode(port);
    await bootstrap.start();
    
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Bootstrap node failed to start:', error);
    process.exit(1);
  }
}

main();