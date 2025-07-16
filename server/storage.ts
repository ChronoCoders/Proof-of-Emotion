import { 
  validators, 
  emotionalProofs, 
  consensusBlocks, 
  networkActivity,
  type Validator, 
  type InsertValidator,
  type EmotionalProof,
  type InsertEmotionalProof,
  type ConsensusBlock,
  type InsertConsensusBlock,
  type NetworkActivity,
  type InsertNetworkActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

export interface IStorage {
  // Validator operations
  createValidator(validator: InsertValidator): Promise<Validator>;
  getValidator(address: string): Promise<Validator | undefined>;
  getActiveValidators(): Promise<Validator[]>;
  updateValidatorTokens(address: string, accessToken: string, refreshToken: string, userId: string): Promise<void>;
  
  // Emotional proof operations
  createEmotionalProof(proof: InsertEmotionalProof): Promise<EmotionalProof>;
  getValidEmotionalProofs(validationWindow: number): Promise<EmotionalProof[]>;
  getLatestProofByValidator(validatorAddress: string): Promise<EmotionalProof | undefined>;
  
  // Consensus operations
  createConsensusBlock(block: InsertConsensusBlock): Promise<ConsensusBlock>;
  getLatestConsensusBlocks(limit: number): Promise<ConsensusBlock[]>;
  getConsensusBlock(blockHeight: number): Promise<ConsensusBlock | undefined>;
  
  // Network activity operations
  createNetworkActivity(activity: InsertNetworkActivity): Promise<NetworkActivity>;
  getRecentNetworkActivity(limit: number): Promise<NetworkActivity[]>;
  
  // Network statistics
  getNetworkStats(): Promise<{
    totalValidators: number;
    totalStake: number;
    recentConsensusRate: number;
    averageNetworkStress: number;
    averageNetworkEnergy: number;
    averageNetworkFocus: number;
  }>;
}

export class MemStorage implements IStorage {
  private validators: Map<string, Validator> = new Map();
  private emotionalProofs: Map<number, EmotionalProof> = new Map();
  private consensusBlocks: Map<number, ConsensusBlock> = new Map();
  private networkActivities: NetworkActivity[] = [];
  private currentValidatorId = 1;
  private currentProofId = 1;
  private currentBlockId = 1;
  private currentActivityId = 1;

  async createValidator(insertValidator: InsertValidator): Promise<Validator> {
    const validator: Validator = {
      ...insertValidator,
      id: this.currentValidatorId++,
      joinedAt: new Date(),
      reputation: 100,
      totalBlocks: 0,
      missedBlocks: 0,
      isActive: true,
      fitbitUserId: null,
      fitbitAccessToken: null,
      fitbitRefreshToken: null,
    };
    this.validators.set(validator.address, validator);
    return validator;
  }

  async getValidator(address: string): Promise<Validator | undefined> {
    return this.validators.get(address);
  }

  async getActiveValidators(): Promise<Validator[]> {
    return Array.from(this.validators.values()).filter(v => v.isActive);
  }

  async updateValidatorTokens(address: string, accessToken: string, refreshToken: string, userId: string): Promise<void> {
    const validator = this.validators.get(address);
    if (validator) {
      validator.fitbitAccessToken = accessToken;
      validator.fitbitRefreshToken = refreshToken;
      validator.fitbitUserId = userId;
      this.validators.set(address, validator);
    }
  }

  async createEmotionalProof(insertProof: InsertEmotionalProof): Promise<EmotionalProof> {
    const proof: EmotionalProof = {
      ...insertProof,
      id: this.currentProofId++,
      timestamp: new Date(),
      hrv: insertProof.hrv ?? null,
      rawBiometricData: insertProof.rawBiometricData ?? null,
    };
    this.emotionalProofs.set(proof.id, proof);
    return proof;
  }

  async getValidEmotionalProofs(validationWindow: number): Promise<EmotionalProof[]> {
    const now = Date.now();
    return Array.from(this.emotionalProofs.values()).filter(
      proof => now - proof.timestamp.getTime() <= validationWindow
    );
  }

  async getLatestProofByValidator(validatorAddress: string): Promise<EmotionalProof | undefined> {
    const proofs = Array.from(this.emotionalProofs.values())
      .filter(p => p.validatorAddress === validatorAddress)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return proofs[0];
  }

  async createConsensusBlock(insertBlock: InsertConsensusBlock): Promise<ConsensusBlock> {
    const block: ConsensusBlock = {
      ...insertBlock,
      id: this.currentBlockId++,
      timestamp: new Date(),
      validatorProofs: insertBlock.validatorProofs ?? null,
    };
    this.consensusBlocks.set(block.blockHeight, block);
    return block;
  }

  async getLatestConsensusBlocks(limit: number): Promise<ConsensusBlock[]> {
    return Array.from(this.consensusBlocks.values())
      .sort((a, b) => b.blockHeight - a.blockHeight)
      .slice(0, limit);
  }

  async getConsensusBlock(blockHeight: number): Promise<ConsensusBlock | undefined> {
    return this.consensusBlocks.get(blockHeight);
  }

  async createNetworkActivity(insertActivity: InsertNetworkActivity): Promise<NetworkActivity> {
    const activity: NetworkActivity = {
      ...insertActivity,
      id: this.currentActivityId++,
      timestamp: new Date(),
      metadata: insertActivity.metadata ?? null,
    };
    this.networkActivities.unshift(activity);
    // Keep only last 1000 activities
    if (this.networkActivities.length > 1000) {
      this.networkActivities = this.networkActivities.slice(0, 1000);
    }
    return activity;
  }

  async getRecentNetworkActivity(limit: number): Promise<NetworkActivity[]> {
    return this.networkActivities.slice(0, limit);
  }

  async getNetworkStats(): Promise<{
    totalValidators: number;
    totalStake: number;
    recentConsensusRate: number;
    averageNetworkStress: number;
    averageNetworkEnergy: number;
    averageNetworkFocus: number;
  }> {
    const activeValidators = await this.getActiveValidators();
    const recentBlocks = await this.getLatestConsensusBlocks(10);
    
    return {
      totalValidators: activeValidators.length,
      totalStake: activeValidators.reduce((sum, v) => sum + v.stake, 0),
      recentConsensusRate: recentBlocks.length > 0 
        ? (recentBlocks.filter(b => b.consensusReached).length / recentBlocks.length) * 100 
        : 0,
      averageNetworkStress: recentBlocks.length > 0 
        ? recentBlocks.reduce((sum, b) => sum + b.networkStress, 0) / recentBlocks.length 
        : 0,
      averageNetworkEnergy: recentBlocks.length > 0 
        ? recentBlocks.reduce((sum, b) => sum + b.networkEnergy, 0) / recentBlocks.length 
        : 0,
      averageNetworkFocus: recentBlocks.length > 0 
        ? recentBlocks.reduce((sum, b) => sum + b.networkFocus, 0) / recentBlocks.length 
        : 0,
    };
  }
}

export class DatabaseStorage implements IStorage {
  async createValidator(insertValidator: InsertValidator): Promise<Validator> {
    const [validator] = await db
      .insert(validators)
      .values(insertValidator)
      .returning();
    return validator;
  }

  async getValidator(address: string): Promise<Validator | undefined> {
    const [validator] = await db
      .select()
      .from(validators)
      .where(eq(validators.address, address));
    return validator || undefined;
  }

  async getActiveValidators(): Promise<Validator[]> {
    return await db
      .select()
      .from(validators)
      .where(eq(validators.isActive, true));
  }

  async updateValidatorTokens(address: string, accessToken: string, refreshToken: string, userId: string): Promise<void> {
    await db
      .update(validators)
      .set({
        fitbitAccessToken: accessToken,
        fitbitRefreshToken: refreshToken,
        fitbitUserId: userId
      })
      .where(eq(validators.address, address));
  }

  async createEmotionalProof(insertProof: InsertEmotionalProof): Promise<EmotionalProof> {
    const [proof] = await db
      .insert(emotionalProofs)
      .values(insertProof)
      .returning();
    return proof;
  }

  async getValidEmotionalProofs(validationWindow: number): Promise<EmotionalProof[]> {
    const cutoffTime = new Date(Date.now() - validationWindow);
    return await db
      .select()
      .from(emotionalProofs)
      .where(gte(emotionalProofs.timestamp, cutoffTime));
  }

  async getLatestProofByValidator(validatorAddress: string): Promise<EmotionalProof | undefined> {
    const [proof] = await db
      .select()
      .from(emotionalProofs)
      .where(eq(emotionalProofs.validatorAddress, validatorAddress))
      .orderBy(desc(emotionalProofs.timestamp))
      .limit(1);
    return proof || undefined;
  }

  async createConsensusBlock(insertBlock: InsertConsensusBlock): Promise<ConsensusBlock> {
    const [block] = await db
      .insert(consensusBlocks)
      .values(insertBlock)
      .returning();
    return block;
  }

  async getLatestConsensusBlocks(limit: number): Promise<ConsensusBlock[]> {
    return await db
      .select()
      .from(consensusBlocks)
      .orderBy(desc(consensusBlocks.blockHeight))
      .limit(limit);
  }

  async getConsensusBlock(blockHeight: number): Promise<ConsensusBlock | undefined> {
    const [block] = await db
      .select()
      .from(consensusBlocks)
      .where(eq(consensusBlocks.blockHeight, blockHeight));
    return block || undefined;
  }

  async createNetworkActivity(insertActivity: InsertNetworkActivity): Promise<NetworkActivity> {
    const [activity] = await db
      .insert(networkActivity)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getRecentNetworkActivity(limit: number): Promise<NetworkActivity[]> {
    return await db
      .select()
      .from(networkActivity)
      .orderBy(desc(networkActivity.timestamp))
      .limit(limit);
  }

  async getNetworkStats(): Promise<{
    totalValidators: number;
    totalStake: number;
    recentConsensusRate: number;
    averageNetworkStress: number;
    averageNetworkEnergy: number;
    averageNetworkFocus: number;
  }> {
    const activeValidators = await this.getActiveValidators();
    const totalValidators = activeValidators.length;
    const totalStake = activeValidators.reduce((sum, v) => sum + v.stake, 0);

    const recentBlocks = await this.getLatestConsensusBlocks(10);
    const recentConsensusRate = recentBlocks.length > 0 
      ? (recentBlocks.filter(b => b.consensusReached).length / recentBlocks.length) * 100
      : 0;

    const averageNetworkStress = recentBlocks.length > 0
      ? recentBlocks.reduce((sum, b) => sum + b.networkStress, 0) / recentBlocks.length
      : 0;

    const averageNetworkEnergy = recentBlocks.length > 0
      ? recentBlocks.reduce((sum, b) => sum + b.networkEnergy, 0) / recentBlocks.length
      : 0;

    const averageNetworkFocus = recentBlocks.length > 0
      ? recentBlocks.reduce((sum, b) => sum + b.networkFocus, 0) / recentBlocks.length
      : 0;

    return {
      totalValidators,
      totalStake,
      recentConsensusRate,
      averageNetworkStress,
      averageNetworkEnergy,
      averageNetworkFocus
    };
  }
}

export const storage = new DatabaseStorage();
