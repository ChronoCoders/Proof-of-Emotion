// EmotionalChain Wallet & CLI Interface
// File: emotional-chain/SRC/wallet/EmotionalWallet.ts

import { createHash, randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EmotionalChain, Transaction, EmotionalValidator, BiometricData } from '../blockchain/EmotionalChain.js';
import { EmotionalNetwork } from '../network/EmotionalNetwork.js';

// Wallet interfaces
interface WalletAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  balance: number;
  emotionalProfile?: EmotionalProfile;
  isValidator: boolean;
}

interface EmotionalProfile {
  baselineEmotions: EmotionalVector;
  stressThreshold: number;
  authenticityScore: number;
  validationHistory: ValidationRecord[];
}

interface ValidationRecord {
  timestamp: number;
  emotionalState: EmotionalVector;
  consensusScore: number;
  rewardEarned: number;
}

interface EmotionalVector {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  neutral: number;
  confidence: number;
}

interface WalletConfig {
  dataDir: string;
  networkPort: number;
  bootstrapNodes: string[];
  validatorSettings?: ValidatorSettings;
}

interface ValidatorSettings {
  minStake: number;
  biometricSensors: string[];
  emotionalThreshold: number;
  autoMining: boolean;
}

// EmotionalChain Wallet Class
class EmotionalWallet {
  private accounts: Map<string, WalletAccount> = new Map();
  private blockchain: EmotionalChain;
  private network: EmotionalNetwork;
  private config: WalletConfig;
  private dataDir: string;
  private currentAccount?: WalletAccount;

  constructor(config: WalletConfig) {
    this.config = config;
    this.dataDir = config.dataDir;
    this.blockchain = new EmotionalChain();
    this.network = new EmotionalNetwork(
      this.blockchain, 
      this.generateNodeId(), 
      config.networkPort
    );
    
    this.initializeWallet();
  }

  // Initialize wallet
  private initializeWallet(): void {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Load existing accounts
    this.loadAccounts();
    
    // Connect to network
    this.connectToNetwork();
    
    console.log('💰 EmotionalChain Wallet initialized');
  }

  // Create new account
  public createAccount(name?: string): WalletAccount {
    const privateKey = this.generatePrivateKey();
    const publicKey = this.generatePublicKey(privateKey);
    const address = this.generateAddress(publicKey);

    const account: WalletAccount = {
      address,
      publicKey,
      privateKey,
      balance: 0,
      isValidator: false
    };

    this.accounts.set(address, account);
    this.saveAccounts();

    console.log(`✅ New account created: ${address}`);
    return account;
  }

  // Import account from private key
  public importAccount(privateKey: string): WalletAccount {
    const publicKey = this.generatePublicKey(privateKey);
    const address = this.generateAddress(publicKey);

    const account: WalletAccount = {
      address,
      publicKey,
      privateKey,
      balance: 0,
      isValidator: false
    };

    this.accounts.set(address, account);
    this.saveAccounts();

    console.log(`📥 Account imported: ${address}`);
    return account;
  }

  // Set current active account
  public setCurrentAccount(address: string): boolean {
    const account = this.accounts.get(address);
    if (account) {
      this.currentAccount = account;
      console.log(`👤 Current account set to: ${address}`);
      return true;
    }
    return false;
  }

  // Get account balance
  public getBalance(address?: string): number {
    const targetAddress = address || this.currentAccount?.address;
    if (!targetAddress) return 0;

    // Calculate balance from blockchain
    const chain = this.blockchain.getChain();
    let balance = 0;

    chain.forEach(block => {
      block.transactions.forEach(tx => {
        if (tx.to === targetAddress) {
          balance += tx.amount;
        }
        if (tx.from === targetAddress) {
          balance -= (tx.amount + tx.fee);
        }
      });
    });

    // Update account balance
    const account = this.accounts.get(targetAddress);
    if (account) {
      account.balance = balance;
      this.accounts.set(targetAddress, account);
    }

    return balance;
  }

  // Send transaction
  public async sendTransaction(
    to: string, 
    amount: number, 
    fee: number = 1
  ): Promise<Transaction | null> {
    if (!this.currentAccount) {
      console.log('❌ No active account selected');
      return null;
    }

    if (this.getBalance() < amount + fee) {
      console.log('❌ Insufficient balance');
      return null;
    }

    const transaction: Transaction = {
      id: this.generateTransactionId(),
      from: this.currentAccount.address,
      to,
      amount,
      fee,
      timestamp: Date.now(),
      signature: this.signTransaction(this.currentAccount.privateKey, { to, amount, fee }),
      type: 'transfer'
    };

    if (this.blockchain.addTransaction(transaction)) {
      console.log(`💸 Transaction sent: ${transaction.id}`);
      return transaction;
    }

    return null;
  }

  // Register as validator
  public async registerAsValidator(
    stake: number,
    biometricProfile: EmotionalProfile
  ): Promise<boolean> {
    if (!this.currentAccount) {
      console.log('❌ No active account selected');
      return false;
    }

    if (this.getBalance() < stake) {
      console.log('❌ Insufficient balance for staking');
      return false;
    }

    const validator: EmotionalValidator = {
      id: this.currentAccount.address,
      publicKey: this.currentAccount.publicKey,
      stake,
      emotionalConsistency: biometricProfile.authenticityScore,
      uptime: 1.0,
      reputation: 0.8, // Initial reputation
      biometricProfile: {
        baselineHeartRate: 72, // Would be calibrated
        emotionalRange: biometricProfile.baselineEmotions,
        stressThreshold: biometricProfile.stressThreshold,
        authenticityScore: biometricProfile.authenticityScore
      },
      lastValidation: Date.now()
    };

    // Register with network
    this.network.registerAsValidator(validator);

    // Update account
    this.currentAccount.isValidator = true;
    this.currentAccount.emotionalProfile = biometricProfile;
    this.accounts.set(this.currentAccount.address, this.currentAccount);
    this.saveAccounts();

    console.log(`👑 Registered as validator with stake: ${stake} EMO`);
    return true;
  }

  // Start mining (for validators)
  public async startMining(biometricData: BiometricData): Promise<void> {
    if (!this.currentAccount?.isValidator) {
      console.log('❌ Account is not a validator');
      return;
    }

    console.log('⛏️  Starting mining with biometric validation...');
    await this.network.startMining(biometricData);
  }

  // Get transaction history
  public getTransactionHistory(address?: string): Transaction[] {
    const targetAddress = address || this.currentAccount?.address;
    if (!targetAddress) return [];

    const chain = this.blockchain.getChain();
    const transactions: Transaction[] = [];

    chain.forEach(block => {
      block.transactions.forEach(tx => {
        if (tx.from === targetAddress || tx.to === targetAddress) {
          transactions.push(tx);
        }
      });
    });

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get emotional validation history
  public getValidationHistory(address?: string): ValidationRecord[] {
    const targetAddress = address || this.currentAccount?.address;
    const account = this.accounts.get(targetAddress || '');
    
    return account?.emotionalProfile?.validationHistory || [];
  }

  // Generate biometric data (for testing)
  public generateTestBiometricData(): BiometricData {
    return {
      heartRate: 60 + Math.random() * 40, // 60-100 BPM
      heartRateVariability: 20 + Math.random() * 60, // 20-80ms
      facialExpression: {
        joy: Math.random(),
        sadness: Math.random() * 0.3,
        anger: Math.random() * 0.2,
        fear: Math.random() * 0.2,
        surprise: Math.random() * 0.4,
        disgust: Math.random() * 0.1,
        neutral: Math.random() * 0.5,
        confidence: 0.7 + Math.random() * 0.3
      },
      voiceStress: Math.random() * 0.5,
      galvanicSkinResponse: Math.random() * 0.6,
      eyeTracking: {
        pupilDilation: 2 + Math.random() * 4, // 2-6mm
        gazePattern: [Math.random(), Math.random(), Math.random()],
        blinkRate: 10 + Math.random() * 20, // 10-30 blinks/min
        fixationDuration: 100 + Math.random() * 400 // 100-500ms
      },
      timestamp: Date.now(),
      deviceSignature: this.generateDeviceSignature()
    };
  }

  // Get wallet status
  public getWalletStatus() {
    return {
      accounts: this.accounts.size,
      currentAccount: this.currentAccount?.address,
      balance: this.getBalance(),
      isValidator: this.currentAccount?.isValidator || false,
      networkPeers: this.network.getNetworkStats().connectedPeers,
      blockchainLength: this.blockchain.getChain().length,
      networkStats: this.network.getNetworkStats()
    };
  }

  // Private helper methods
  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePrivateKey(): string {
    return randomBytes(32).toString('hex');
  }

  private generatePublicKey(privateKey: string): string {
    return createHash('sha256').update(privateKey).digest('hex');
  }

  private generateAddress(publicKey: string): string {
    return createHash('ripemd160').update(publicKey).digest('hex');
  }

  private generateTransactionId(): string {
    return createHash('sha256')
      .update(Date.now().toString() + Math.random())
      .digest('hex')
      .substring(0, 16);
  }

  private generateDeviceSignature(): string {
    return createHash('sha256')
      .update(`device_${Date.now()}_${Math.random()}`)
      .digest('hex')
      .substring(0, 32);
  }

  private signTransaction(privateKey: string, data: any): string {
    const dataString = JSON.stringify(data);
    return createHash('sha256').update(privateKey + dataString).digest('hex');
  }

  private async connectToNetwork(): Promise<void> {
    for (const node of this.config.bootstrapNodes) {
      const [host, port] = node.split(':');
      await this.network.connectToPeer(host, parseInt(port));
    }
  }

  private loadAccounts(): void {
    const accountsPath = path.join(this.dataDir, 'accounts.json');
    if (fs.existsSync(accountsPath)) {
      try {
        const accountsData = fs.readFileSync(accountsPath, 'utf8');
        const accounts = JSON.parse(accountsData);
        
        Object.entries(accounts).forEach(([address, account]) => {
          this.accounts.set(address, account as WalletAccount);
        });
        
        console.log(`📂 Loaded ${this.accounts.size} accounts`);
      } catch (error) {
        console.error('❌ Failed to load accounts:', error);
      }
    }
  }

  private saveAccounts(): void {
    const accountsPath = path.join(this.dataDir, 'accounts.json');
    const accountsData = Object.fromEntries(this.accounts);
    
    try {
      fs.writeFileSync(accountsPath, JSON.stringify(accountsData, null, 2));
    } catch (error) {
      console.error('❌ Failed to save accounts:', error);
    }
  }

  // Get all accounts
  public getAccounts(): WalletAccount[] {
    return Array.from(this.accounts.values());
  }

  // Get current account
  public getCurrentAccount(): WalletAccount | undefined {
    return this.currentAccount;
  }

  // Shutdown wallet
  public shutdown(): void {
    this.saveAccounts();
    this.network.shutdown();
    console.log('💰 EmotionalChain Wallet shutdown complete');
  }
}

// CLI Interface
class EmotionalChainCLI {
  private wallet: EmotionalWallet;

  constructor(wallet: EmotionalWallet) {
    this.wallet = wallet;
  }

  // Process CLI commands
  public async processCommand(command: string, args: string[]): Promise<void> {
    switch (command.toLowerCase()) {
      case 'help':
        this.showHelp();
        break;

      case 'create-account':
        this.createAccount(args[0]);
        break;

      case 'import-account':
        this.importAccount(args[0]);
        break;

      case 'list-accounts':
        this.listAccounts();
        break;

      case 'set-account':
        this.setCurrentAccount(args[0]);
        break;

      case 'balance':
        this.showBalance(args[0]);
        break;

      case 'send':
        await this.sendTransaction(args[0], parseFloat(args[1]), parseFloat(args[2]));
        break;

      case 'register-validator':
        await this.registerValidator(parseFloat(args[0]));
        break;

      case 'start-mining':
        await this.startMining();
        break;

      case 'history':
        this.showTransactionHistory(args[0]);
        break;

      case 'validation-history':
        this.showValidationHistory(args[0]);
        break;

      case 'status':
        this.showWalletStatus();
        break;

      case 'network-stats':
        this.showNetworkStats();
        break;

      case 'blockchain-info':
        this.showBlockchainInfo();
        break;

      case 'generate-biometric':
        this.generateTestBiometric();
        break;

      case 'exit':
        this.wallet.shutdown();
        process.exit(0);
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
        this.showHelp();
    }
  }

  private showHelp(): void {
    console.log(`
🧠 EmotionalChain CLI - Proof of Emotion Blockchain

ACCOUNT MANAGEMENT:
  create-account [name]           Create new wallet account
  import-account <private-key>    Import account from private key
  list-accounts                   List all accounts
  set-account <address>           Set active account
  balance [address]               Show account balance

TRANSACTIONS:
  send <to-address> <amount> [fee]  Send EMO tokens
  history [address]                 Show transaction history

VALIDATOR OPERATIONS:
  register-validator <stake>        Register as validator
  start-mining                      Start mining with biometric data
  validation-history [address]     Show validation history

NETWORK & BLOCKCHAIN:
  status                           Show wallet status
  network-stats                    Show network statistics
  blockchain-info                  Show blockchain information

TESTING:
  generate-biometric              Generate test biometric data

GENERAL:
  help                            Show this help message
  exit                            Exit the CLI

Examples:
  create-account my-wallet
  send 0x1234... 100 1
  register-validator 5000
  start-mining
    `);
  }

  private createAccount(name?: string): void {
    const account = this.wallet.createAccount(name);
    console.log(`✅ Account created successfully!`);
    console.log(`   Address: ${account.address}`);
    console.log(`   Public Key: ${account.publicKey}`);
    console.log(`   Private Key: ${account.privateKey}`);
    console.log(`⚠️  Keep your private key safe and never share it!`);
  }

  private importAccount(privateKey: string): void {
    if (!privateKey) {
      console.log('❌ Private key required');
      return;
    }

    try {
      const account = this.wallet.importAccount(privateKey);
      console.log(`✅ Account imported successfully!`);
      console.log(`   Address: ${account.address}`);
    } catch (error) {
      console.log('❌ Failed to import account:', error);
    }
  }

  private listAccounts(): void {
    const accounts = this.wallet.getAccounts();
    const current = this.wallet.getCurrentAccount();

    console.log(`\n📋 Wallet Accounts (${accounts.length}):`);
    console.log('─'.repeat(80));
    
    accounts.forEach((account, index) => {
      const isCurrent = current?.address === account.address;
      const indicator = isCurrent ? '👤' : '  ';
      const validatorBadge = account.isValidator ? '👑' : '  ';
      
      console.log(`${indicator} ${index + 1}. ${account.address}`);
      console.log(`   ${validatorBadge} Balance: ${account.balance} EMO | Validator: ${account.isValidator}`);
      console.log('');
    });
  }

  private setCurrentAccount(address: string): void {
    if (!address) {
      console.log('❌ Address required');
      return;
    }

    if (this.wallet.setCurrentAccount(address)) {
      console.log(`✅ Current account set to: ${address}`);
    } else {
      console.log('❌ Account not found');
    }
  }

  private showBalance(address?: string): void {
    const balance = this.wallet.getBalance(address);
    const targetAddress = address || this.wallet.getCurrentAccount()?.address;
    
    if (!targetAddress) {
      console.log('❌ No account specified or selected');
      return;
    }

    console.log(`💰 Balance for ${targetAddress}: ${balance} EMO`);
  }

  private async sendTransaction(to: string, amount: number, fee: number = 1): Promise<void> {
    if (!to || !amount) {
      console.log('❌ Recipient address and amount required');
      return;
    }

    const transaction = await this.wallet.sendTransaction(to, amount, fee);
    if (transaction) {
      console.log(`✅ Transaction sent successfully!`);
      console.log(`   Transaction ID: ${transaction.id}`);
      console.log(`   To: ${transaction.to}`);
      console.log(`   Amount: ${transaction.amount} EMO`);
      console.log(`   Fee: ${transaction.fee} EMO`);
    }
  }

  private async registerValidator(stake: number): Promise<void> {
    if (!stake || stake < 1000) {
      console.log('❌ Minimum stake of 1000 EMO required');
      return;
    }

    // Generate test emotional profile
    const emotionalProfile: EmotionalProfile = {
      baselineEmotions: {
        joy: 0.6,
        sadness: 0.1,
        anger: 0.05,
        fear: 0.1,
        surprise: 0.1,
        disgust: 0.05,
        neutral: 0.0,
        confidence: 0.85
      },
      stressThreshold: 0.3,
      authenticityScore: 0.88,
      validationHistory: []
    };

    const success = await this.wallet.registerAsValidator(stake, emotionalProfile);
    if (success) {
      console.log(`✅ Successfully registered as validator!`);
      console.log(`   Stake: ${stake} EMO`);
      console.log(`   Authenticity Score: ${emotionalProfile.authenticityScore}`);
    }
  }

  private async startMining(): Promise<void> {
    console.log('⛏️  Starting mining process...');
    console.log('🧠 Collecting biometric data...');
    
    const biometricData = this.wallet.generateTestBiometricData();
    await this.wallet.startMining(biometricData);
    
    console.log('✅ Mining attempt completed');
  }

  private showTransactionHistory(address?: string): void {
    const history = this.wallet.getTransactionHistory(address);
    const targetAddress = address || this.wallet.getCurrentAccount()?.address;

    console.log(`\n📜 Transaction History for ${targetAddress}:`);
    console.log('─'.repeat(80));

    if (history.length === 0) {
      console.log('No transactions found');
      return;
    }

    history.slice(0, 10).forEach((tx, index) => {
      const date = new Date(tx.timestamp).toLocaleString();
      const type = tx.from === targetAddress ? '📤 OUT' : '📥 IN';
      const peer = tx.from === targetAddress ? tx.to : tx.from;
      
      console.log(`${index + 1}. ${type} | ${tx.amount} EMO | ${date}`);
      console.log(`   ${tx.from === targetAddress ? 'To' : 'From'}: ${peer}`);
      console.log(`   TX ID: ${tx.id} | Fee: ${tx.fee} EMO`);
      console.log('');
    });
  }

  private showValidationHistory(address?: string): void {
    const history = this.wallet.getValidationHistory(address);
    const targetAddress = address || this.wallet.getCurrentAccount()?.address;

    console.log(`\n🧠 Validation History for ${targetAddress}:`);
    console.log('─'.repeat(80));

    if (history.length === 0) {
      console.log('No validation records found');
      return;
    }

    history.slice(0, 10).forEach((record, index) => {
      const date = new Date(record.timestamp).toLocaleString();
      
      console.log(`${index + 1}. ${date}`);
      console.log(`   Consensus Score: ${record.consensusScore.toFixed(3)}`);
      console.log(`   Reward Earned: ${record.rewardEarned} EMO`);
      console.log(`   Dominant Emotion: ${this.getDominantEmotion(record.emotionalState)}`);
      console.log('');
    });
  }

  private showWalletStatus(): void {
    const status = this.wallet.getWalletStatus();
    
    console.log(`\n📊 Wallet Status:`);
    console.log('─'.repeat(50));
    console.log(`Accounts: ${status.accounts}`);
    console.log(`Current Account: ${status.currentAccount || 'None'}`);
    console.log(`Balance: ${status.balance} EMO`);
    console.log(`Validator Status: ${status.isValidator ? '👑 Yes' : '❌ No'}`);
    console.log(`Network Peers: ${status.networkPeers}`);
    console.log(`Blockchain Length: ${status.blockchainLength} blocks`);
  }

  private showNetworkStats(): void {
    const stats = this.wallet.getWalletStatus().networkStats;
    
    console.log(`\n🌐 Network Statistics:`);
    console.log('─'.repeat(50));
    console.log(`Connected Peers: ${stats.connectedPeers}`);
    console.log(`Active Validators: ${stats.activeValidators}`);
    console.log(`Network Latency: ${stats.networkLatency}ms`);
    console.log(`Consensus Participation: ${(stats.consensusParticipation * 100).toFixed(1)}%`);
    console.log(`Emotional Sync Rate: ${(stats.emotionalSyncRate * 100).toFixed(1)}%`);
  }

  private showBlockchainInfo(): void {
    const status = this.wallet.getWalletStatus();
    
    console.log(`\n⛓️  Blockchain Information:`);
    console.log('─'.repeat(50));
    console.log(`Total Blocks: ${status.blockchainLength}`);
    console.log(`Network Type: Proof of Emotion`);
    console.log(`Connected Peers: ${status.networkPeers}`);
    console.log(`Active Validators: ${status.networkStats.activeValidators}`);
  }

  private generateTestBiometric(): void {
    const biometricData = this.wallet.generateTestBiometricData();
    
    console.log(`\n🔬 Generated Test Biometric Data:`);
    console.log('─'.repeat(50));
    console.log(`Heart Rate: ${biometricData.heartRate.toFixed(1)} BPM`);
    console.log(`HRV: ${biometricData.heartRateVariability.toFixed(1)}ms`);
    console.log(`Voice Stress: ${(biometricData.voiceStress * 100).toFixed(1)}%`);
    console.log(`Skin Response: ${(biometricData.galvanicSkinResponse * 100).toFixed(1)}%`);
    console.log(`Pupil Dilation: ${biometricData.eyeTracking.pupilDilation.toFixed(1)}mm`);
    console.log(`Dominant Emotion: ${this.getDominantEmotion(biometricData.facialExpression)}`);
    console.log(`Confidence: ${(biometricData.facialExpression.confidence * 100).toFixed(1)}%`);
  }

  private getDominantEmotion(emotions: EmotionalVector): string {
    const emotionEntries = Object.entries(emotions).filter(([key]) => key !== 'confidence');
    const dominant = emotionEntries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    return `${dominant[0]} (${(dominant[1] * 100).toFixed(1)}%)`;
  }
}

// Main CLI Application
class EmotionalChainApp {
  private wallet: EmotionalWallet;
  private cli: EmotionalChainCLI;

  constructor() {
    const config: WalletConfig = {
      dataDir: './emotional-wallet-data',
      networkPort: 8001,
      bootstrapNodes: ['localhost:8000'], // Bootstrap nodes
      validatorSettings: {
        minStake: 1000,
        biometricSensors: ['heartRate', 'facial', 'voice', 'skin'],
        emotionalThreshold: 0.75,
        autoMining: false
      }
    };

    this.wallet = new EmotionalWallet(config);
    this.cli = new EmotionalChainCLI(this.wallet);
  }

  public async start(): Promise<void> {
    console.log(`
🧠 EmotionalChain - Proof of Emotion Blockchain
===============================================
Welcome to the revolutionary blockchain that validates emotions!

Type 'help' for available commands or 'exit' to quit.
    `);

    // Set up CLI input handling
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'emotional-chain> '
    });

    rl.prompt();

    rl.on('line', async (input: string) => {
      const trimmedInput = input.trim();
      if (trimmedInput) {
        const [command, ...args] = trimmedInput.split(' ');
        try {
          await this.cli.processCommand(command, args);
        } catch (error) {
          console.error('❌ Error executing command:', error);
        }
      }
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('\n👋 Goodbye!');
      this.wallet.shutdown();
      process.exit(0);
    });
  }
}

// Export classes
export {
  EmotionalWallet,
  EmotionalChainCLI,
  EmotionalChainApp,
  type WalletAccount,
  type EmotionalProfile,
  type WalletConfig
};

// Example usage and startup script
/*
// File: src/main.ts
import { EmotionalChainApp } from './wallet/EmotionalWallet';

async function main() {
  const app = new EmotionalChainApp();
  await app.start();
}

main().catch(console.error);
*/

// Package.json scripts for the project:
/*
{
  "name": "emotional-chain",
  "version": "1.0.0",
  "description": "Proof of Emotion Blockchain Implementation",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "dev": "ts-node src/main.ts",
    "wallet": "ts-node src/wallet/EmotionalWallet.ts",
    "validator": "ts-node src/validator.ts",
    "test": "jest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "@types/ws": "^8.5.8",
    "crypto": "^1.0.1"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1",
    "@types/node": "^20.8.0",
    "jest": "^29.7.0"
  }
}
*/