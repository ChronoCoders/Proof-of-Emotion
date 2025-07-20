const bootstrapNode = `
// File: src/network/bootstrap-node.ts
import { EmotionalChain } from '../blockchain/EmotionalChain';
import { EmotionalNetwork } from './EmotionalNetwork';

class BootstrapNode {
  private blockchain: EmotionalChain;
  private network: EmotionalNetwork;
  private port: number;

  constructor(port: number = 8000) {
    this.port = port;
    this.blockchain = new EmotionalChain();
    this.network = new EmotionalNetwork(this.blockchain, \`bootstrap_\${port}\`, port);
  }

  public async start(): Promise<void> {
    console.log(\`🚀 Bootstrap node starting on port \${this.port}\`);
    console.log('🌐 Waiting for peer connections...');
    
    // Keep the process alive
    setInterval(() => {
      const stats = this.network.getNetworkStats();
      console.log(\`📊 Connected peers: \${stats.connectedPeers}, Validators: \${stats.activeValidators}\`);
    }, 30000);
  }
}

async function main() {
  const port = parseInt(process.argv[2]) || 8000;
  const bootstrap = new BootstrapNode(port);
  await bootstrap.start();
}

main().catch(console.error);
`;
