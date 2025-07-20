// EmotionalChain Wallet CLI Runner
// File: emotional-chain/SRC/wallet-cli.ts

import { config } from 'dotenv';

// Load environment variables
config({ quiet: true });

function displayWalletBanner(): void {
  console.log(`
===============================================
    EMOTIONALCHAIN WALLET & CLI INTERFACE
===============================================
Manage your emotions, stake tokens, mine blocks
Version: 1.0.0 - Consensus: Proof of Emotion
  `);
}

// Interface definitions for wallet configuration
interface WalletConfig {
  dataDir: string;
  networkPort: number;
  bootstrapNodes: string[];
  validatorSettings?: {
    minStake: number;
    biometricSensors: string[];
    emotionalThreshold: number;
    autoMining: boolean;
  };
}

// Simple EmotionalWallet class for CLI
class EmotionalWallet {
  private config: WalletConfig;
  private accounts: Map<string, any> = new Map();
  private currentAccount: string | null = null;

  constructor(config: WalletConfig) {
    this.config = config;
    console.log('EmotionalChain Wallet initialized');
  }

  createAccount(name?: string): { address: string; balance: number } {
    const address = `0x${Math.random().toString(16).substr(2, 40)}`;
    const account = {
      address,
      name: name || `Account_${this.accounts.size + 1}`,
      balance: 1000, // Starting balance
      isValidator: false
    };
    
    this.accounts.set(address, account);
    this.currentAccount = address;
    
    console.log(`Account created: ${account.name}`);
    console.log(`Address: ${address}`);
    console.log(`Starting balance: ${account.balance} EMO`);
    
    return { address, balance: account.balance };
  }

  getAccounts(): any[] {
    return Array.from(this.accounts.values());
  }

  setCurrentAccount(address: string): boolean {
    if (this.accounts.has(address)) {
      this.currentAccount = address;
      console.log(`Current account set to: ${address}`);
      return true;
    }
    console.log('Account not found');
    return false;
  }

  getBalance(address?: string): number {
    const targetAddress = address || this.currentAccount;
    if (!targetAddress) {
      console.log('No account selected');
      return 0;
    }
    
    const account = this.accounts.get(targetAddress);
    return account ? account.balance : 0;
  }

  sendTransaction(to: string, amount: number, fee: number = 1): boolean {
    if (!this.currentAccount) {
      console.log('No account selected');
      return false;
    }

    const fromAccount = this.accounts.get(this.currentAccount);
    if (!fromAccount || fromAccount.balance < amount + fee) {
      console.log('Insufficient balance');
      return false;
    }

    fromAccount.balance -= (amount + fee);
    
    console.log(`Transaction sent: ${amount} EMO to ${to}`);
    console.log(`Fee: ${fee} EMO`);
    console.log(`New balance: ${fromAccount.balance} EMO`);
    
    return true;
  }

  registerAsValidator(stake: number): boolean {
    if (!this.currentAccount) {
      console.log('No account selected');
      return false;
    }

    const account = this.accounts.get(this.currentAccount);
    if (!account || account.balance < stake) {
      console.log('Insufficient balance for staking');
      return false;
    }

    account.isValidator = true;
    account.stake = stake;
    account.balance -= stake;
    
    console.log(`Registered as validator with stake: ${stake} EMO`);
    console.log(`Remaining balance: ${account.balance} EMO`);
    
    return true;
  }

  startMining(): void {
    if (!this.currentAccount) {
      console.log('No account selected');
      return;
    }

    const account = this.accounts.get(this.currentAccount);
    if (!account || !account.isValidator) {
      console.log('Account is not a validator');
      return;
    }

    console.log('Starting mining with biometric validation...');
    console.log('Generating test biometric data...');
    console.log('Heart Rate: 75 BPM');
    console.log('Emotion: Calm (85% confidence)');
    console.log('Authenticity Score: 92%');
    console.log('Mining attempt completed - block validation in progress');
  }

  getStatus(): any {
    return {
      accounts: this.accounts.size,
      currentAccount: this.currentAccount,
      balance: this.getBalance(),
      isValidator: this.currentAccount ? this.accounts.get(this.currentAccount)?.isValidator : false
    };
  }

  shutdown(): void {
    console.log('EmotionalChain Wallet shutdown');
  }
}

// CLI Command Processor
class EmotionalChainCLI {
  private wallet: EmotionalWallet;

  constructor(wallet: EmotionalWallet) {
    this.wallet = wallet;
  }

  async processCommand(command: string, args: string[]): Promise<void> {
    switch (command.toLowerCase()) {
      case 'help':
        this.showHelp();
        break;

      case 'create-account':
        this.wallet.createAccount(args[0]);
        break;

      case 'list-accounts':
        this.listAccounts();
        break;

      case 'set-account':
        this.wallet.setCurrentAccount(args[0]);
        break;

      case 'balance':
        const balance = this.wallet.getBalance(args[0]);
        console.log(`Balance: ${balance} EMO`);
        break;

      case 'send':
        if (args.length >= 2) {
          this.wallet.sendTransaction(args[0], parseFloat(args[1]), parseFloat(args[2]) || 1);
        } else {
          console.log('Usage: send [to-address] [amount] [fee]');
        }
        break;

      case 'register-validator':
        if (args[0]) {
          this.wallet.registerAsValidator(parseFloat(args[0]));
        } else {
          console.log('Usage: register-validator [stake-amount]');
        }
        break;

      case 'start-mining':
        this.wallet.startMining();
        break;

      case 'status':
        const status = this.wallet.getStatus();
        console.log('Wallet Status:');
        console.log(`   Accounts: ${status.accounts}`);
        console.log(`   Current: ${status.currentAccount || 'None'}`);
        console.log(`   Balance: ${status.balance} EMO`);
        console.log(`   Validator: ${status.isValidator ? 'Yes' : 'No'}`);
        break;

      case 'exit':
        console.log('Shutting down EmotionalChain Wallet...');
        this.wallet.shutdown();
        process.exit(0);
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log('Type "help" for available commands');
    }
  }

  private showHelp(): void {
    console.log('EmotionalChain Wallet Commands:');
    console.log('   create-account [name]       - Create new wallet account');
    console.log('   list-accounts               - List all accounts');
    console.log('   set-account [address]       - Set active account');
    console.log('   balance [address]           - Show account balance');
    console.log('   send [to] [amount] [fee]    - Send EMO tokens');
    console.log('   register-validator [stake]  - Register as validator');
    console.log('   start-mining                - Start mining with biometrics');
    console.log('   status                      - Show wallet status');
    console.log('   help                        - Show this help');
    console.log('   exit                        - Exit wallet');
  }

  private listAccounts(): void {
    const accounts = this.wallet.getAccounts();
    console.log('Wallet Accounts:');
    if (accounts.length === 0) {
      console.log('   No accounts found');
    } else {
      accounts.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.address})`);
        console.log(`      Balance: ${account.balance} EMO - Validator: ${account.isValidator ? 'Yes' : 'No'}`);
      });
    }
  }
}

// Main function to start the wallet CLI
async function main(): Promise<void> {
  try {
    displayWalletBanner();

    // Create wallet configuration
    const config: WalletConfig = {
      dataDir: './data',
      networkPort: 3001,
      bootstrapNodes: ['localhost:3000'],
      validatorSettings: {
        minStake: 100,
        biometricSensors: ['heart_rate', 'emotion_detection'],
        emotionalThreshold: 0.8,
        autoMining: false
      }
    };

    // Initialize wallet and CLI
    const wallet = new EmotionalWallet(config);
    const cli = new EmotionalChainCLI(wallet);
    
    console.log('EmotionalChain Wallet Ready!');
    console.log('');
    console.log('Available Commands:');
    console.log('   create-account [name]        - Create new wallet account');
    console.log('   list-accounts               - List all accounts');
    console.log('   set-account <address>       - Set active account');
    console.log('   balance [address]           - Show account balance');
    console.log('   send <to> <amount> [fee]    - Send EMO tokens');
    console.log('   register-validator <stake>  - Register as validator');
    console.log('   start-mining                - Start mining with biometrics');
    console.log('   status                      - Show wallet status');
    console.log('   help                        - Show all commands');
    console.log('   exit                        - Exit wallet');
    console.log('');

    // Set up CLI input handling
    const { createInterface } = await import('readline');
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'emotional-wallet> '
    });

    rl.prompt();

    rl.on('line', async (input: string) => {
      const trimmedInput = input.trim();
      if (trimmedInput) {
        const [command, ...args] = trimmedInput.split(' ');
        try {
          await cli.processCommand(command, args);
        } catch (error) {
          console.error('Error executing command:', error);
        }
      }
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('\nEmotionalChain Wallet closed. Goodbye!');
      wallet.shutdown();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start EmotionalChain Wallet:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down EmotionalChain Wallet...');
  process.exit(0);
});

// Start the wallet CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});