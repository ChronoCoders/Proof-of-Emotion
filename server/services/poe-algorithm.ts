import { storage } from "../storage";
import type { InsertEmotionalProof, InsertConsensusBlock } from "@shared/schema";

export interface BiometricData {
  heartRate: number;
  hrv?: number;
  skinConductance?: number;
  movement?: number;
  timestamp: number;
}

export interface EmotionalMetrics {
  stress: number;
  energy: number;
  focus: number;
}

export class ProofOfEmotion {
  public readonly name = "Proof of Emotion (PoE)";
  public readonly version = "1.0.0";
  public readonly consensusThreshold = 67;
  public readonly validationWindow = 300000; // 5 minutes
  public readonly minValidators = 3;
  public readonly maxValidators = 21;

  async registerValidator(address: string, stake: number, biometricDevice: string) {
    if (stake < 10000) {
      throw new Error("Minimum stake required: 10,000 EMOTION tokens");
    }

    const validator = await storage.createValidator({
      address,
      stake,
      biometricDevice,
    });

    await storage.createNetworkActivity({
      type: "validator_registration",
      message: `Validator ${address} registered with ${stake.toLocaleString()} EMOTION stake`,
      metadata: { address, stake, biometricDevice }
    });

    return validator;
  }

  async generateEmotionalProof(validatorAddress: string, biometricData: BiometricData) {
    const validator = await storage.getValidator(validatorAddress);
    if (!validator) {
      throw new Error("Validator not registered");
    }

    const emotionalMetrics = this.calculateEmotionalMetrics(biometricData);
    const authenticityScore = this.calculateAuthenticity(biometricData);
    
    if (authenticityScore < 80) {
      throw new Error("Biometric authenticity too low for consensus participation");
    }

    const proofData: InsertEmotionalProof = {
      validatorAddress,
      heartRate: biometricData.heartRate,
      hrv: biometricData.hrv || 0,
      stressLevel: emotionalMetrics.stress,
      energyLevel: emotionalMetrics.energy,
      focusLevel: emotionalMetrics.focus,
      authenticityScore,
      biometricHash: this.hashBiometricData(biometricData),
      signature: this.signEmotionalProof(validatorAddress, emotionalMetrics),
      rawBiometricData: biometricData,
    };

    const proof = await storage.createEmotionalProof(proofData);

    await storage.createNetworkActivity({
      type: "emotional_proof",
      message: `Validator ${validatorAddress} submitted emotional proof: S:${emotionalMetrics.stress}% E:${emotionalMetrics.energy}% F:${emotionalMetrics.focus}%`,
      metadata: { validatorAddress, metrics: emotionalMetrics, authenticityScore }
    });

    return proof;
  }

  calculateEmotionalMetrics(biometricData: BiometricData): EmotionalMetrics {
    const { heartRate, hrv = 0, skinConductance = 0, movement = 0 } = biometricData;
    
    let stress = 0;
    if (heartRate > 100) stress += 30;
    if (heartRate > 120) stress += 20;
    if (hrv < 20) stress += 25;
    if (skinConductance > 0.7) stress += 25;
    stress = Math.min(stress, 100);

    let energy = 50;
    if (heartRate > 80 && heartRate < 100) energy += 20;
    if (movement > 0.5) energy += 15;
    if (hrv > 40) energy += 15;
    energy = Math.min(energy, 100);

    let focus = 70;
    if (hrv > 30 && stress < 30) focus += 20;
    if (stress > 70) focus -= 30;
    if (movement < 0.2) focus += 10;
    focus = Math.max(0, Math.min(focus, 100));

    return { stress, energy, focus };
  }

  calculateAuthenticity(biometricData: BiometricData): number {
    let authenticity = 100;
    
    // Check for obvious patterns that might indicate spoofing
    if (biometricData.heartRate % 5 === 0) authenticity -= 10;
    
    if (biometricData.heartRate < 40 || biometricData.heartRate > 200) {
      authenticity -= 30;
    }
    
    const expectedConductance = (biometricData.heartRate - 60) / 100;
    const conductanceDiff = Math.abs((biometricData.skinConductance || 0) - expectedConductance);
    if (conductanceDiff > 0.3) authenticity -= 15;

    return Math.max(authenticity, 0);
  }

  async calculatePoEConsensus(blockHeight: number) {
    const validProofs = await storage.getValidEmotionalProofs(this.validationWindow);
    
    if (validProofs.length < this.minValidators) {
      throw new Error(`Insufficient validators for consensus. Need ${this.minValidators}, got ${validProofs.length}`);
    }

    // Get validator stakes for weighted consensus
    const proofsWithStakes = await Promise.all(
      validProofs.map(async (proof) => {
        const validator = await storage.getValidator(proof.validatorAddress);
        return { ...proof, stake: validator?.stake || 0 };
      })
    );

    const totalStake = proofsWithStakes.reduce((sum, proof) => sum + proof.stake, 0);
    
    let weightedStress = 0;
    let weightedEnergy = 0;
    let weightedFocus = 0;
    let weightedAuthenticity = 0;

    proofsWithStakes.forEach(proof => {
      const weight = proof.stake / totalStake;
      weightedStress += proof.stressLevel * weight;
      weightedEnergy += proof.energyLevel * weight;
      weightedFocus += proof.focusLevel * weight;
      weightedAuthenticity += proof.authenticityScore * weight;
    });

    const agreementScore = this.calculateEmotionalAgreement(proofsWithStakes);
    
    const consensusData: InsertConsensusBlock = {
      blockHeight,
      networkStress: Math.round(weightedStress),
      networkEnergy: Math.round(weightedEnergy),
      networkFocus: Math.round(weightedFocus),
      networkAuthenticity: Math.round(weightedAuthenticity),
      agreementScore: Math.round(agreementScore),
      participatingValidators: validProofs.length,
      totalStake,
      consensusReached: agreementScore >= this.consensusThreshold,
      validatorProofs: proofsWithStakes.map(p => ({
        validator: p.validatorAddress,
        stress: p.stressLevel,
        energy: p.energyLevel,
        focus: p.focusLevel,
        authenticity: p.authenticityScore,
        stake: p.stake
      }))
    };

    const consensus = await storage.createConsensusBlock(consensusData);

    await storage.createNetworkActivity({
      type: "consensus",
      message: `Block ${blockHeight} consensus ${consensus.consensusReached ? 'REACHED' : 'FAILED'} (${consensus.agreementScore}% agreement)`,
      metadata: { blockHeight, consensus }
    });

    return consensus;
  }

  private calculateEmotionalAgreement(proofs: Array<{ stressLevel: number; energyLevel: number; focusLevel: number; stake: number }>) {
    if (proofs.length < 2) return 100;

    let totalAgreement = 0;
    let comparisons = 0;

    for (let i = 0; i < proofs.length; i++) {
      for (let j = i + 1; j < proofs.length; j++) {
        const proof1 = proofs[i];
        const proof2 = proofs[j];
        
        const stressSimilarity = 1 - Math.abs(proof1.stressLevel - proof2.stressLevel) / 100;
        const energySimilarity = 1 - Math.abs(proof1.energyLevel - proof2.energyLevel) / 100;
        const focusSimilarity = 1 - Math.abs(proof1.focusLevel - proof2.focusLevel) / 100;
        
        const combinedStake = proof1.stake + proof2.stake;
        const avgSimilarity = (stressSimilarity + energySimilarity + focusSimilarity) / 3;
        
        totalAgreement += avgSimilarity * combinedStake;
        comparisons += combinedStake;
      }
    }

    return comparisons > 0 ? (totalAgreement / comparisons) * 100 : 0;
  }

  private hashBiometricData(data: BiometricData): string {
    const dataString = JSON.stringify({
      heartRate: data.heartRate,
      hrv: data.hrv,
      timestamp: data.timestamp
    });
    
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private signEmotionalProof(validator: string, metrics: EmotionalMetrics): string {
    return `poe_${validator}_${metrics.stress}_${metrics.energy}_${metrics.focus}_${Date.now()}`;
  }
}

export const poeAlgorithm = new ProofOfEmotion();
