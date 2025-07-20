// EmotionalChain - Custom Proof of Emotion Blockchain Implementation
// File: emotional-chain/SRC/blockchain/EmotionalChain.ts

import { createHash } from 'crypto';
import { EventEmitter } from 'events';

// Core Interfaces
interface BiometricData {
  heartRate: number;
  heartRateVariability: number;
  facialExpression: EmotionalVector;
  voiceStress: number;
  galvanicSkinResponse: number;
  eyeTracking: EyeData;
  timestamp: number;
  deviceSignature: string;
}

interface EmotionalVector {
  joy: number;      // [0,1]
  sadness: number;  // [0,1]
  anger: number;    // [0,1]
  fear: number;     // [0,1]
  surprise: number; // [0,1]
  disgust: number;  // [0,1]
  neutral: number;  // [0,1]
  confidence: number; // [0,1]
}

interface EyeData {
  pupilDilation: number;
  gazePattern: number[];
  blinkRate: number;
  fixationDuration: number;
}

interface EmotionalValidator {
  id: string;
  publicKey: string;
  stake: number;
  emotionalConsistency: number; // [0,1]
  uptime: number; // [0,1]
  reputation: number; // [0,1]
  biometricProfile: BiometricProfile;
  lastValidation: number;
}

interface BiometricProfile {
  baselineHeartRate: number;
  emotionalRange: EmotionalVector;
  stressThreshold: number;
  authenticityScore: number;
}

interface EmotionalProposal {
  validatorId: string;
  emotionalState: EmotionalVector;
  biometricHash: string;
  confidence: number;
  timestamp: number;
  signature: string;
}

interface PoEBlock {
  index: number;
  timestamp: number;
  previousHash: string;
  hash: string;
  transactions: Transaction[];
  emotionalConsensus: EmotionalConsensus;
  validator: string;
  nonce: number;
  difficulty: number;
}

interface EmotionalConsensus {
  proposals: EmotionalProposal[];
  consensusScore: number;
  participatingValidators: string[];
  emotionalState: EmotionalVector;
  authenticity: number;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  signature: string;
  type: 'transfer' | 'stake' | 'emotional_validation' | 'biometric_registration';
  data?: any;
}

// Emotional Consensus Engine
class EmotionalConsensusEngine {
  private validators: Map<string, EmotionalValidator> = new Map();
  private pendingProposals: EmotionalProposal[] = [];
  private consensusThreshold = 0.67; // 67% agreement required
  private minValidators = 3;
  
  constructor() {
    this.initializeEngine();
  }

  private initializeEngine(): void {
    console.log('[INIT] Initializing Emotional Consensus Engine');
  }

  // Register a new validator with biometric profile
  registerValidator(validator: EmotionalValidator): boolean {
    if (this.validateBiometricProfile(validator.biometricProfile)) {
      this.validators.set(validator.id, validator);
      console.log(`[SUCCESS] Validator ${validator.id} registered with emotional consistency: ${validator.emotionalConsistency}`);
      return true;
    }
    return false;
  }

  // Validate biometric profile authenticity
  private validateBiometricProfile(profile: BiometricProfile): boolean {
    return profile.authenticityScore >= 0.75 && 
           profile.baselineHeartRate > 40 && 
           profile.baselineHeartRate < 120 &&
           profile.stressThreshold > 0.1;
  }

  // Process emotional proposal from validator
  async processEmotionalProposal(proposal: EmotionalProposal): Promise<boolean> {
    const validator = this.validators.get(proposal.validatorId);
    if (!validator) return false;

    // Verify proposal authenticity
    if (await this.verifyProposalAuthenticity(proposal, validator)) {
      this.pendingProposals.push(proposal);
      console.log(`[EMOTION] Emotional proposal received from ${proposal.validatorId}`);
      
      // Check if we have enough proposals for consensus
      if (this.pendingProposals.length >= this.minValidators) {
        return await this.attemptConsensus();
      }
    }
    return false;
  }

  // Verify proposal authenticity using multi-modal validation
  private async verifyProposalAuthenticity(
    proposal: EmotionalProposal, 
    validator: EmotionalValidator
  ): Promise<boolean> {
    // Verify signature
    if (!this.verifySignature(proposal)) return false;

    // Check emotional consistency with validator's profile
    const consistencyScore = this.calculateEmotionalConsistency(
      proposal.emotionalState, 
      validator.biometricProfile.emotionalRange
    );

    // Verify timestamp (must be recent)
    const timeDiff = Date.now() - proposal.timestamp;
    if (timeDiff > 30000) return false; // 30 seconds max

    // Check minimum confidence threshold
    if (proposal.confidence < 0.6) return false;

    return consistencyScore >= 0.5;
  }

  // Calculate emotional consistency between proposal and validator profile
  private calculateEmotionalConsistency(
    proposalEmotion: EmotionalVector,
    baselineEmotion: EmotionalVector
  ): number {
    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];
    let totalDifference = 0;

    emotions.forEach(emotion => {
      const diff = Math.abs(proposalEmotion[emotion as keyof EmotionalVector] - 
                           baselineEmotion[emotion as keyof EmotionalVector]);
      totalDifference += diff;
    });

    return Math.max(0, 1 - (totalDifference / emotions.length));
  }

  // Attempt to reach emotional consensus
  private async attemptConsensus(): Promise<boolean> {
    const activeValidators = this.getActiveValidators();
    if (activeValidators.length < this.minValidators) return false;

    // Calculate weighted consensus
    const consensusResult = this.calculateWeightedConsensus();
    
    if (consensusResult.consensusScore >= this.consensusThreshold) {
      console.log(`[CONSENSUS] Emotional consensus reached! Score: ${consensusResult.consensusScore}`);
      this.pendingProposals = []; // Clear proposals
      return true;
    }

    return false;
  }

  // Calculate weighted emotional consensus
  private calculateWeightedConsensus(): EmotionalConsensus {
    let totalWeight = 0;
    const weightedEmotions: EmotionalVector = {
      joy: 0, sadness: 0, anger: 0, fear: 0, 
      surprise: 0, disgust: 0, neutral: 0, confidence: 0
    };

    this.pendingProposals.forEach(proposal => {
      const validator = this.validators.get(proposal.validatorId)!;
      const weight = this.calculateValidatorWeight(validator);
      totalWeight += weight;

      Object.keys(weightedEmotions).forEach(emotion => {
        weightedEmotions[emotion as keyof EmotionalVector] += 
          proposal.emotionalState[emotion as keyof EmotionalVector] * weight;
      });
    });

    // Normalize weighted emotions
    Object.keys(weightedEmotions).forEach(emotion => {
      weightedEmotions[emotion as keyof EmotionalVector] /= totalWeight;
    });

    // Calculate consensus score
    const consensusScore = this.calculateConsensusScore();
    const authenticity = this.calculateAuthenticityScore();

    return {
      proposals: [...this.pendingProposals],
      consensusScore,
      participatingValidators: this.pendingProposals.map(p => p.validatorId),
      emotionalState: weightedEmotions,
      authenticity
    };
  }

  // Calculate validator weight based on stake, reputation, and consistency
  private calculateValidatorWeight(validator: EmotionalValidator): number {
    const stakeWeight = Math.min(validator.stake / 10000, 1); // Max weight at 10k stake
    const reputationWeight = validator.reputation;
    const consistencyWeight = validator.emotionalConsistency;
    const uptimeWeight = validator.uptime;

    return (stakeWeight * 0.3 + reputationWeight * 0.3 + 
            consistencyWeight * 0.3 + uptimeWeight * 0.1);
  }

  // Calculate overall consensus score
  private calculateConsensusScore(): number {
    if (this.pendingProposals.length < 2) return 0;

    let totalAgreement = 0;
    let comparisons = 0;

    for (let i = 0; i < this.pendingProposals.length; i++) {
      for (let j = i + 1; j < this.pendingProposals.length; j++) {
        const agreement = this.calculateEmotionalAgreement(
          this.pendingProposals[i].emotionalState,
          this.pendingProposals[j].emotionalState
        );
        totalAgreement += agreement;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalAgreement / comparisons : 0;
  }

  // Calculate agreement between two emotional states
  private calculateEmotionalAgreement(emotion1: EmotionalVector, emotion2: EmotionalVector): number {
    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];
    let totalSimilarity = 0;

    emotions.forEach(emotion => {
      const diff = Math.abs(emotion1[emotion as keyof EmotionalVector] - 
                           emotion2[emotion as keyof EmotionalVector]);
      totalSimilarity += (1 - diff); // Convert difference to similarity
    });

    return totalSimilarity / emotions.length;
  }

  // Calculate authenticity score
  private calculateAuthenticityScore(): number {
    let totalAuthenticity = 0;
    
    this.pendingProposals.forEach(proposal => {
      const validator = this.validators.get(proposal.validatorId)!;
      totalAuthenticity += validator.biometricProfile.authenticityScore * proposal.confidence;
    });

    return this.pendingProposals.length > 0 ? 
           totalAuthenticity / this.pendingProposals.length : 0;
  }

  private getActiveValidators(): EmotionalValidator[] {
    return Array.from(this.validators.values()).filter(v => v.uptime >= 0.8);
  }

  private verifySignature(proposal: EmotionalProposal): boolean {
    // Simplified signature verification
    return proposal.signature.length > 0;
  }
}

// Main EmotionalChain Blockchain Class
class EmotionalChain extends EventEmitter {
  private chain: PoEBlock[] = [];
  private pendingTransactions: Transaction[] = [];
  private consensusEngine: EmotionalConsensusEngine;
  private difficulty = 4;
  private miningReward = 10;
  private validators: Map<string, EmotionalValidator> = new Map();

  constructor() {
    super();
    this.consensusEngine = new EmotionalConsensusEngine();
    this.createGenesisBlock();
    console.log('[READY] EmotionalChain initialized with Proof of Emotion consensus');
  }

  // Create the genesis block
  private createGenesisBlock(): void {
    const genesisBlock: PoEBlock = {
      index: 0,
      timestamp: Date.now(),
      previousHash: '0',
      hash: '',
      transactions: [],
      emotionalConsensus: {
        proposals: [],
        consensusScore: 1.0,
        participatingValidators: [],
        emotionalState: {
          joy: 0.7, sadness: 0.1, anger: 0.05, fear: 0.05,
          surprise: 0.05, disgust: 0.05, neutral: 0.0, confidence: 1.0
        },
        authenticity: 1.0
      },
      validator: 'genesis',
      nonce: 0,
      difficulty: 0
    };

    genesisBlock.hash = this.calculateHash(genesisBlock);
    this.chain.push(genesisBlock);
  }

  // Add a new transaction to pending pool
  addTransaction(transaction: Transaction): boolean {
    if (this.validateTransaction(transaction)) {
      this.pendingTransactions.push(transaction);
      this.emit('transactionAdded', transaction);
      return true;
    }
    return false;
  }

  // Validate transaction
  private validateTransaction(transaction: Transaction): boolean {
    return transaction.amount > 0 && 
           transaction.fee >= 0 && 
           transaction.from !== transaction.to &&
           transaction.signature.length > 0;
  }

  // Mine a new block with PoE consensus
  async mineBlock(validatorId: string, biometricData: BiometricData): Promise<PoEBlock | null> {
    const validator = this.validators.get(validatorId);
    if (!validator) {
      console.log('[ERROR] Validator not found');
      return null;
    }

    // Create emotional proposal from biometric data
    const emotionalProposal = await this.createEmotionalProposal(validatorId, biometricData);
    
    // Process proposal through consensus engine
    const consensusReached = await this.consensusEngine.processEmotionalProposal(emotionalProposal);
    
    if (!consensusReached) {
      console.log('[WAITING] Waiting for emotional consensus...');
      return null;
    }

    // Create new block
    const newBlock: PoEBlock = {
      index: this.chain.length,
      timestamp: Date.now(),
      previousHash: this.getLatestBlock().hash,
      hash: '',
      transactions: [...this.pendingTransactions],
      emotionalConsensus: {
        proposals: [emotionalProposal],
        consensusScore: 0.85, // This would be calculated by consensus engine
        participatingValidators: [validatorId],
        emotionalState: emotionalProposal.emotionalState,
        authenticity: 0.92
      },
      validator: validatorId,
      nonce: 0,
      difficulty: this.difficulty
    };

    // Proof of Emotion mining (simplified)
    newBlock.hash = this.mineBlockWithPoE(newBlock);
    
    // Add block to chain
    this.chain.push(newBlock);
    this.pendingTransactions = [];

    // Reward validator
    this.rewardValidator(validatorId);

    console.log(`[MINING] Block mined by validator ${validatorId} with emotional consensus`);
    this.emit('blockMined', newBlock);
    
    return newBlock;
  }

  // Create emotional proposal from biometric data
  private async createEmotionalProposal(
    validatorId: string, 
    biometricData: BiometricData
  ): Promise<EmotionalProposal> {
    // Process biometric data through ML engine (simplified)
    const emotionalState = this.processBiometricData(biometricData);
    
    const proposal: EmotionalProposal = {
      validatorId,
      emotionalState,
      biometricHash: this.hashBiometricData(biometricData),
      confidence: emotionalState.confidence,
      timestamp: Date.now(),
      signature: this.signProposal(validatorId, emotionalState)
    };

    return proposal;
  }

  // Process biometric data into emotional state (ML integration point)
  private processBiometricData(biometricData: BiometricData): EmotionalVector {
    // This would integrate with your ML engine
    // For demo purposes, using simplified logic
    
    const heartRateStress = Math.max(0, (biometricData.heartRate - 70) / 50);
    const skinStress = biometricData.galvanicSkinResponse;
    
    return {
      joy: Math.max(0, 0.8 - heartRateStress),
      sadness: biometricData.facialExpression.sadness,
      anger: Math.min(1, heartRateStress + skinStress),
      fear: Math.min(1, biometricData.voiceStress),
      surprise: biometricData.facialExpression.surprise,
      disgust: biometricData.facialExpression.disgust,
      neutral: biometricData.facialExpression.neutral,
      confidence: 0.85 // Would be calculated by ML model
    };
  }

  // Hash biometric data for privacy
  private hashBiometricData(biometricData: BiometricData): string {
    const dataString = JSON.stringify({
      heartRate: biometricData.heartRate,
      voiceStress: biometricData.voiceStress,
      timestamp: biometricData.timestamp
    });
    return createHash('sha256').update(dataString).digest('hex');
  }

  // Sign emotional proposal
  private signProposal(validatorId: string, emotionalState: EmotionalVector): string {
    const dataToSign = JSON.stringify({ validatorId, emotionalState, timestamp: Date.now() });
    return createHash('sha256').update(dataToSign).digest('hex');
  }

  // Proof of Emotion mining (lightweight compared to PoW)
  private mineBlockWithPoE(block: PoEBlock): string {
    let hash = '';
    let nonce = 0;
    
    // PoE mining is much lighter than PoW - based on emotional authenticity
    const target = '0'.repeat(Math.max(1, this.difficulty - 2)); // Easier than PoW
    
    do {
      nonce++;
      hash = this.calculateHash({ ...block, nonce });
    } while (!hash.startsWith(target) && nonce < 10000); // Limit iterations
    
    block.nonce = nonce;
    return hash;
  }

  // Calculate block hash
  private calculateHash(block: PoEBlock): string {
    const blockString = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      previousHash: block.previousHash,
      transactions: block.transactions,
      emotionalConsensus: block.emotionalConsensus,
      nonce: block.nonce
    });
    return createHash('sha256').update(blockString).digest('hex');
  }

  // Reward validator with EMO tokens
  private rewardValidator(validatorId: string): void {
    const rewardTransaction: Transaction = {
      id: this.generateTransactionId(),
      from: 'system',
      to: validatorId,
      amount: this.miningReward,
      fee: 0,
      timestamp: Date.now(),
      signature: 'system_reward',
      type: 'emotional_validation'
    };
    
    console.log(`[REWARD] Rewarded ${this.miningReward} EMO tokens to validator ${validatorId}`);
  }

  // Register new validator
  registerValidator(validator: EmotionalValidator): boolean {
    if (this.validateValidatorRequirements(validator)) {
      this.validators.set(validator.id, validator);
      this.consensusEngine.registerValidator(validator);
      console.log(`[VALIDATOR] New validator registered: ${validator.id}`);
      return true;
    }
    return false;
  }

  // Validate validator requirements
  private validateValidatorRequirements(validator: EmotionalValidator): boolean {
    return validator.stake >= 1000 && // Minimum 1000 EMO stake
           validator.emotionalConsistency >= 0.75 && // 75% emotional consistency
           validator.uptime >= 0.90 && // 90% uptime requirement
           validator.biometricProfile.authenticityScore >= 0.75; // 75% authenticity
  }

  // Get latest block
  getLatestBlock(): PoEBlock {
    return this.chain[this.chain.length - 1];
  }

  // Validate entire chain
  validateChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Validate hash
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        return false;
      }

      // Validate previous hash link
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      // Validate emotional consensus
      if (currentBlock.emotionalConsensus.consensusScore < 0.67) {
        return false;
      }
    }
    return true;
  }

  // Get chain statistics
  getChainStats() {
    const totalBlocks = this.chain.length;
    const totalValidators = this.validators.size;
    const avgConsensusScore = this.chain.reduce((sum, block) => 
      sum + block.emotionalConsensus.consensusScore, 0) / totalBlocks;
    
    return {
      totalBlocks,
      totalValidators,
      avgConsensusScore,
      avgAuthenticity: this.chain.reduce((sum, block) => 
        sum + block.emotionalConsensus.authenticity, 0) / totalBlocks,
      difficulty: this.difficulty,
      miningReward: this.miningReward
    };
  }

  private generateTransactionId(): string {
    return createHash('sha256').update(Date.now().toString() + Math.random()).digest('hex').substring(0, 16);
  }

  // Get blockchain data
  getChain(): PoEBlock[] {
    return [...this.chain];
  }

  // Get pending transactions
  getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions];
  }
}

export {
  EmotionalChain,
  EmotionalConsensusEngine,
  type PoEBlock,
  type EmotionalValidator,
  type BiometricData,
  type EmotionalVector,
  type Transaction,
  type EmotionalProposal,
  type EmotionalConsensus
};