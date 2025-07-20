import { storage } from "../storage";
import type { InsertEmotionalProof, InsertConsensusBlock } from "../../shared/schema";
import { spawn } from 'child_process';
import path from 'path';

export interface BiometricData {
  heartRate: number;
  hrv?: number;
  skinConductance?: number;
  movement?: number;
  timestamp: number;
  respiratoryRate?: number;
  temperature?: number;
  accelerationX?: number;
  accelerationY?: number;
  accelerationZ?: number;
  ambientLight?: number;
}

export interface EmotionalMetrics {
  stress: number;
  energy: number;
  focus: number;
  authenticity: number;
  confidence: number;
  emotionCategory: string;
  mlPrediction?: number;
}

export interface MLResponse {
  stress: number;
  energy: number;
  focus: number;
  authenticity: number;
  confidence: number;
  emotion_category: string;
  ml_prediction?: number;
  consensus_ready?: boolean;
  readiness_score?: number;
  ml_used?: boolean;
  error?: string;
}

export class ProofOfEmotion {
  public readonly name = "Proof of Emotion (PoE) with AI";
  public readonly version = "2.0.0";
  public readonly consensusThreshold = 67;
  public readonly validationWindow = 300000; // 5 minutes
  public readonly minValidators = 3;
  public readonly maxValidators = 21;
  private mlEngineEnabled = false;
  private mlModelPath: string;

  constructor() {
    this.mlModelPath = path.join(process.cwd(), 'ml-engine', 'models', 'emotionalchain_models.pkl');
    this.initializeMLEngine();
  }

  private async initializeMLEngine() {
    try {
      const fs = await import('fs').then(module => module.promises);
      await fs.access(this.mlModelPath);
      this.mlEngineEnabled = true;
      console.log('EmotionalChain: ML Engine initialized successfully');
    } catch (error) {
      console.log('EmotionalChain: ML Engine not available, using rule-based fallback');
      this.mlEngineEnabled = false;
    }
  }

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
      message: `Validator ${address} registered with ${stake.toLocaleString()} EMOTION stake (ML: ${this.mlEngineEnabled ? 'enabled' : 'disabled'})`,
      metadata: { address, stake, biometricDevice, mlEnabled: this.mlEngineEnabled }
    });

    return validator;
  }

  async generateEmotionalProof(validatorAddress: string, biometricData: BiometricData) {
    const validator = await storage.getValidator(validatorAddress);
    if (!validator) {
      throw new Error("Validator not registered");
    }

    const processedBiometrics = this.preprocessBiometricData(biometricData);
    
    let emotionalMetrics: EmotionalMetrics;
    
    if (this.mlEngineEnabled) {
      try {
        emotionalMetrics = await this.calculateEmotionalMetricsML(processedBiometrics);
      } catch (error) {
        console.warn('EmotionalChain: ML calculation failed, falling back to rule-based:', error);
        emotionalMetrics = this.calculateEmotionalMetricsRuleBased(processedBiometrics);
      }
    } else {
      emotionalMetrics = this.calculateEmotionalMetricsRuleBased(processedBiometrics);
    }
    
    if (emotionalMetrics.authenticity < 80) {
      throw new Error(`Biometric authenticity too low for consensus participation (${emotionalMetrics.authenticity}%)`);
    }

    const proofData: InsertEmotionalProof = {
      validatorAddress,
      heartRate: processedBiometrics.heartRate,
      hrv: processedBiometrics.hrv || 0,
      stressLevel: emotionalMetrics.stress,
      energyLevel: emotionalMetrics.energy,
      focusLevel: emotionalMetrics.focus,
      authenticityScore: emotionalMetrics.authenticity,
      biometricHash: this.hashBiometricData(processedBiometrics),
      signature: this.signEmotionalProof(validatorAddress, emotionalMetrics),
      rawBiometricData: {
        ...processedBiometrics,
        mlProcessed: this.mlEngineEnabled,
        emotionCategory: emotionalMetrics.emotionCategory,
        confidence: emotionalMetrics.confidence
      },
    };

    const proof = await storage.createEmotionalProof(proofData);

    await storage.createNetworkActivity({
      type: "emotional_proof",
      message: `Validator ${validatorAddress} submitted ${this.mlEngineEnabled ? 'AI-enhanced' : 'rule-based'} emotional proof: S:${emotionalMetrics.stress}% E:${emotionalMetrics.energy}% F:${emotionalMetrics.focus}% (${emotionalMetrics.emotionCategory})`,
      metadata: { 
        validatorAddress, 
        metrics: emotionalMetrics, 
        mlUsed: this.mlEngineEnabled,
        authenticityScore: emotionalMetrics.authenticity 
      }
    });

    return proof;
  }

  private preprocessBiometricData(data: BiometricData): BiometricData {
    const processed: BiometricData = {
      heartRate: this.validateHeartRate(data.heartRate),
      hrv: this.validateHRV(data.hrv || 0),
      skinConductance: this.validateSkinConductance(data.skinConductance || 0.5),
      movement: this.validateMovement(data.movement || 0.1),
      timestamp: data.timestamp || Date.now(),
      respiratoryRate: data.respiratoryRate || this.estimateRespiratoryRate(data.heartRate),
      temperature: data.temperature || this.estimateTemperature(data.heartRate),
      accelerationX: data.accelerationX || 0,
      accelerationY: data.accelerationY || 0,
      accelerationZ: data.accelerationZ || 9.8,
      ambientLight: data.ambientLight || 0.5
    };

    return processed;
  }

  private validateHeartRate(hr: number): number {
    return Math.max(40, Math.min(200, hr || 70));
  }

  private validateHRV(hrv: number): number {
    return Math.max(5, Math.min(100, hrv));
  }

  private validateSkinConductance(gsr: number): number {
    return Math.max(0, Math.min(1, gsr));
  }

  private validateMovement(movement: number): number {
    return Math.max(0, Math.min(1, movement));
  }

  private estimateRespiratoryRate(heartRate: number): number {
    const baseRR = 14;
    const hrEffect = (heartRate - 70) * 0.08;
    return Math.max(8, Math.min(25, baseRR + hrEffect));
  }

  private estimateTemperature(heartRate: number): number {
    const baseTemp = 36.5;
    const hrEffect = (heartRate - 70) * 0.01;
    return Math.max(35.5, Math.min(38.5, baseTemp + hrEffect));
  }

  private async calculateEmotionalMetricsML(biometricData: BiometricData): Promise<EmotionalMetrics> {
    return new Promise((resolve, reject) => {
      const mlInput = {
        heart_rate: biometricData.heartRate,
        hrv: biometricData.hrv,
        skin_conductance: biometricData.skinConductance,
        movement: biometricData.movement,
        respiratory_rate: biometricData.respiratoryRate,
        temperature: biometricData.temperature,
        acceleration_x: biometricData.accelerationX,
        acceleration_y: biometricData.accelerationY,
        acceleration_z: biometricData.accelerationZ,
        ambient_light: biometricData.ambientLight
      };

      const pythonPath = path.join(process.cwd(), 'ml-engine', 'inference.py');
      const pythonProcess = spawn('python', [pythonPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const mlResponse: MLResponse = JSON.parse(output.trim());
            
            if (mlResponse.error) {
              reject(new Error(`ML inference error: ${mlResponse.error}`));
              return;
            }
            
            resolve({
              stress: Math.round(mlResponse.stress),
              energy: Math.round(mlResponse.energy),
              focus: Math.round(mlResponse.focus),
              authenticity: Math.round(mlResponse.authenticity),
              confidence: mlResponse.confidence,
              emotionCategory: mlResponse.emotion_category,
              mlPrediction: mlResponse.ml_prediction
            });
          } catch (parseError) {
            reject(new Error(`Failed to parse ML response: ${parseError}`));
          }
        } else {
          reject(new Error(`ML process failed with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(mlInput));
      pythonProcess.stdin.end();

      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('ML inference timeout'));
      }, 5000);
    });
  }

  calculateEmotionalMetricsRuleBased(biometricData: BiometricData): EmotionalMetrics {
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

    const authenticity = this.calculateAuthenticity(biometricData);

    let emotionCategory = 'neutral';
    if (stress > 70) emotionCategory = 'stressed';
    else if (stress < 20 && energy < 40) emotionCategory = 'calm';
    else if (focus > 80 && stress < 40) emotionCategory = 'focused';
    else if (energy > 80) emotionCategory = 'excited';

    return {
      stress,
      energy,
      focus,
      authenticity,
      confidence: 0.85,
      emotionCategory
    };
  }

  calculateAuthenticity(biometricData: BiometricData): number {
    let authenticity = 100;
    
    const { heartRate, hrv = 0, skinConductance = 0, movement = 0 } = biometricData;
    
    if (heartRate % 5 === 0 && heartRate % 10 === 0) authenticity -= 15;
    
    if (heartRate < 40 || heartRate > 200) authenticity -= 40;
    if (hrv < 5 || hrv > 100) authenticity -= 20;
    
    const expectedConductance = (heartRate - 60) / 100;
    const conductanceDiff = Math.abs(skinConductance - expectedConductance);
    if (conductanceDiff > 0.4) authenticity -= 20;
    
    if (heartRate > 120 && movement < 0.05) authenticity -= 25;
    if (heartRate < 60 && movement > 0.8) authenticity -= 20;
    
    if (heartRate > 100 && hrv > 60) authenticity -= 30;
    
    return Math.max(0, authenticity);
  }

  async calculatePoEConsensus(blockHeight: number) {
    const validProofs = await storage.getValidEmotionalProofs(this.validationWindow);
    
    if (validProofs.length < this.minValidators) {
      throw new Error(`Insufficient validators for consensus. Need ${this.minValidators}, got ${validProofs.length}`);
    }

    const proofsWithStakes = await Promise.all(
      validProofs.map(async (proof) => {
        const validator = await storage.getValidator(proof.validatorAddress);
        return { 
          ...proof, 
          stake: validator?.stake || 0,
          mlProcessed: proof.rawBiometricData?.mlProcessed || false
        };
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
    
    const mlProcessedCount = proofsWithStakes.filter(p => p.mlProcessed).length;
    
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
        stake: p.stake,
        mlProcessed: p.mlProcessed,
        emotionCategory: p.rawBiometricData?.emotionCategory || 'unknown'
      }))
    };

    const consensus = await storage.createConsensusBlock(consensusData);

    await storage.createNetworkActivity({
      type: "consensus",
      message: `Block ${blockHeight} ${this.mlEngineEnabled ? 'AI-enhanced' : 'rule-based'} consensus ${consensus.consensusReached ? 'REACHED' : 'FAILED'} (${consensus.agreementScore}% agreement, ${mlProcessedCount}/${validProofs.length} ML-processed)`,
      metadata: { 
        blockHeight, 
        consensus, 
        mlEnabled: this.mlEngineEnabled,
        mlProcessedValidators: mlProcessedCount,
        totalValidators: validProofs.length
      }
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
      timestamp: data.timestamp,
      mlProcessed: this.mlEngineEnabled
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
    return `poe_v2_${validator}_${metrics.stress}_${metrics.energy}_${metrics.focus}_${Date.now()}_${this.mlEngineEnabled ? 'ml' : 'rule'}`;
  }

  public isMLEngineEnabled(): boolean {
    return this.mlEngineEnabled;
  }

  public getMLEngineStats(): any {
    return {
      enabled: this.mlEngineEnabled,
      version: this.version,
      modelPath: this.mlModelPath,
      consensusThreshold: this.consensusThreshold,
      features: [
        'Advanced emotion classification',
        'AI-powered authenticity detection',
        'Multi-model ensemble predictions',
        'Real-time biometric processing',
        'Enhanced anti-spoofing'
      ]
    };
  }

  public async testMLClassification(biometricData: BiometricData): Promise<EmotionalMetrics> {
    const processedBiometrics = this.preprocessBiometricData(biometricData);
    
    if (this.mlEngineEnabled) {
      try {
        return await this.calculateEmotionalMetricsML(processedBiometrics);
      } catch (error) {
        console.warn('ML test failed, using rule-based fallback:', error);
        return this.calculateEmotionalMetricsRuleBased(processedBiometrics);
      }
    } else {
      return this.calculateEmotionalMetricsRuleBased(processedBiometrics);
    }
  }
}

export const poeAlgorithm = new ProofOfEmotion();