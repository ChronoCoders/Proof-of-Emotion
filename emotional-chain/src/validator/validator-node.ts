const validatorNode = `
// File: src/validator/validator-node.ts
import { EmotionalWallet, WalletConfig } from '../wallet/EmotionalWallet';
import { EmotionalValidator, BiometricData } from '../blockchain/EmotionalChain';

class ValidatorNode {
  private wallet: EmotionalWallet;
  private validatorId: string;
  private isRunning: boolean = false;

  constructor(validatorId: string, port: number) {
    this.validatorId = validatorId;
    
    const config: WalletConfig = {
      dataDir: \`./validator-data-\${validatorId}\`,
      networkPort: port,
      bootstrapNodes: ['localhost:8000'],
      validatorSettings: {
        minStake: 1000,
        biometricSensors: ['heartRate', 'facial', 'voice', 'skin'],
        emotionalThreshold: 0.75,
        autoMining: true
      }
    };

    this.wallet = new EmotionalWallet(config);
  }

  public async start(): Promise<void> {
    console.log(\`👑 Starting validator node: \${this.validatorId}\`);
    
    // Create validator account
    const account = this.wallet.createAccount(\`validator_\${this.validatorId}\`);
    this.wallet.setCurrentAccount(account.address);
    
    // Register as validator (in production, would need to fund account first)
    const emotionalProfile = {
      baselineEmotions: {
        joy: 0.7, sadness: 0.1, anger: 0.05, fear: 0.1,
        surprise: 0.05, disgust: 0.0, neutral: 0.0, confidence: 0.9
      },
      stressThreshold: 0.3,
      authenticityScore: 0.88,
      validationHistory: []
    };

    await this.wallet.registerAsValidator(5000, emotionalProfile);
    
    // Start automated mining
    this.isRunning = true;
    this.startMiningLoop();
    
    console.log(\`✅ Validator \${this.validatorId} is now active and mining\`);
  }

  private async startMiningLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Generate biometric data (in production, would come from real sensors)
        const biometricData = this.wallet.generateTestBiometricData();
        
        // Attempt to mine
        await this.wallet.startMining(biometricData);
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
        
      } catch (error) {
        console.error('❌ Mining error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds on error
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.wallet.shutdown();
    console.log(\`🛑 Validator \${this.validatorId} stopped\`);
  }
}

async function main() {
  const validatorId = process.argv[2] || 'default';
  const port = parseInt(process.argv[3]) || 8001;
  
  const validator = new ValidatorNode(validatorId, port);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    validator.stop();
    process.exit(0);
  });
  
  await validator.start();
}

main().catch(console.error);
`;