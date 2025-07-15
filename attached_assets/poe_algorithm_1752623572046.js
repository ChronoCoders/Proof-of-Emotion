// proof-of-emotion-core.js
// Core Proof of Emotion (PoE) Consensus Algorithm for EmotionalChain

class ProofOfEmotion {
  constructor() {
    this.name = "Proof of Emotion (PoE)";
    this.version = "1.0.0";
    this.consensusThreshold = 67; // 67% emotional agreement required
    this.validationWindow = 300000; // 5 minutes in milliseconds
    this.minValidators = 3; // Minimum for testing
    this.maxValidators = 21;
    
    // Active validators and their emotional proofs
    this.validators = new Map();
    this.emotionalProofs = new Map();
    this.consensusHistory = [];
    
    console.log("🔗 Proof of Emotion (PoE) Algorithm Initialized");
  }

  // Register a validator with biometric device
  async registerValidator(address, stake, biometricDevice) {
    if (stake < 10000) {
      throw new Error("Minimum stake required: 10,000 EMOTION tokens");
    }

    const validator = {
      address,
      stake,
      biometricDevice,
      joinedAt: Date.now(),
      reputation: 100,
      totalBlocks: 0,
      missedBlocks: 0,
      authenticity: 0,
      isActive: true
    };

    this.validators.set(address, validator);
    console.log(`✅ Validator ${address} registered with ${stake} EMOTION stake`);
    
    return validator;
  }

  // Generate emotional proof from biometric data
  async generateEmotionalProof(validatorAddress, biometricData) {
    const validator = this.validators.get(validatorAddress);
    if (!validator) {
      throw new Error("Validator not registered");
    }

    // Calculate emotional metrics from biometric data
    const emotionalMetrics = this.calculateEmotionalMetrics(biometricData);
    
    // Calculate authenticity score (anti-spoofing)
    const authenticityScore = this.calculateAuthenticity(biometricData);
    
    if (authenticityScore < 80) {
      throw new Error("Biometric authenticity too low for consensus participation");
    }

    const proof = {
      validator: validatorAddress,
      timestamp: Date.now(),
      heartRate: biometricData.heartRate,
      hrv: biometricData.hrv || 0,
      stressLevel: emotionalMetrics.stress,
      energyLevel: emotionalMetrics.energy,
      focusLevel: emotionalMetrics.focus,
      authenticityScore,
      stake: validator.stake,
      biometricHash: this.hashBiometricData(biometricData),
      signature: this.signEmotionalProof(validatorAddress, emotionalMetrics)
    };

    this.emotionalProofs.set(validatorAddress, proof);
    console.log(`📊 Emotional proof generated for ${validatorAddress}: Stress:${emotionalMetrics.stress}% Energy:${emotionalMetrics.energy}% Focus:${emotionalMetrics.focus}%`);
    
    return proof;
  }

  // Calculate emotional metrics from raw biometric data
  calculateEmotionalMetrics(biometricData) {
    const { heartRate, hrv, skinConductance, movement } = biometricData;
    
    // Stress Level (0-100): Based on HR and HRV
    let stress = 0;
    if (heartRate > 100) stress += 30;
    if (heartRate > 120) stress += 20;
    if (hrv < 20) stress += 25;
    if (skinConductance > 0.7) stress += 25;
    stress = Math.min(stress, 100);

    // Energy Level (0-100): Based on HR and movement
    let energy = 50; // baseline
    if (heartRate > 80 && heartRate < 100) energy += 20;
    if (movement > 0.5) energy += 15;
    if (hrv > 40) energy += 15;
    energy = Math.min(energy, 100);

    // Focus Level (0-100): Based on HRV and stress
    let focus = 70; // baseline
    if (hrv > 30 && stress < 30) focus += 20;
    if (stress > 70) focus -= 30;
    if (movement < 0.2) focus += 10; // stillness indicates focus
    focus = Math.max(0, Math.min(focus, 100));

    return { stress, energy, focus };
  }

  // Calculate biometric authenticity score (anti-spoofing)
  calculateAuthenticity(biometricData) {
    let authenticity = 100;
    
    // Check for natural HR variability
    if (biometricData.heartRate % 5 === 0) authenticity -= 10; // Too perfect
    
    // Check for realistic ranges
    if (biometricData.heartRate < 40 || biometricData.heartRate > 200) {
      authenticity -= 30;
    }
    
    // Check for data correlation (HR and skin conductance should correlate)
    const expectedConductance = (biometricData.heartRate - 60) / 100;
    const conductanceDiff = Math.abs(biometricData.skinConductance - expectedConductance);
    if (conductanceDiff > 0.3) authenticity -= 15;
    
    // Temporal consistency check
    if (biometricData.timestamp && this.hasTemporalInconsistency(biometricData)) {
      authenticity -= 20;
    }

    return Math.max(authenticity, 0);
  }

  // Core PoE consensus calculation
  async calculatePoEConsensus(blockHeight) {
    const validProofs = this.getValidEmotionalProofs();
    
    if (validProofs.length < this.minValidators) {
      throw new Error(`Insufficient validators for consensus. Need ${this.minValidators}, got ${validProofs.length}`);
    }

    const totalStake = validProofs.reduce((sum, proof) => sum + proof.stake, 0);
    
    // Calculate weighted emotional consensus
    let weightedStress = 0;
    let weightedEnergy = 0;
    let weightedFocus = 0;
    let weightedAuthenticity = 0;

    validProofs.forEach(proof => {
      const weight = proof.stake / totalStake;
      weightedStress += proof.stressLevel * weight;
      weightedEnergy += proof.energyLevel * weight;
      weightedFocus += proof.focusLevel * weight;
      weightedAuthenticity += proof.authenticityScore * weight;
    });

    // Calculate emotional agreement score
    const agreementScore = this.calculateEmotionalAgreement(validProofs);
    
    const consensus = {
      blockHeight,
      timestamp: Date.now(),
      networkStress: Math.round(weightedStress),
      networkEnergy: Math.round(weightedEnergy),
      networkFocus: Math.round(weightedFocus),
      networkAuthenticity: Math.round(weightedAuthenticity),
      agreementScore: Math.round(agreementScore),
      participatingValidators: validProofs.length,
      totalStake,
      consensusReached: agreementScore >= this.consensusThreshold,
      validatorProofs: validProofs.map(p => ({
        validator: p.validator,
        stress: p.stressLevel,
        energy: p.energyLevel,
        focus: p.focusLevel,
        authenticity: p.authenticityScore,
        stake: p.stake
      }))
    };

    // Store consensus in history
    this.consensusHistory.push(consensus);
    
    console.log(`🧠 PoE Consensus Block ${blockHeight}:`);
    console.log(`   Network Emotional State: Stress:${consensus.networkStress}% Energy:${consensus.networkEnergy}% Focus:${consensus.networkFocus}%`);
    console.log(`   Agreement Score: ${consensus.agreementScore}% (Threshold: ${this.consensusThreshold}%)`);
    console.log(`   Consensus: ${consensus.consensusReached ? '✅ REACHED' : '❌ FAILED'}`);
    
    return consensus;
  }

  // Calculate how much validators agree emotionally
  calculateEmotionalAgreement(proofs) {
    if (proofs.length < 2) return 100;

    let totalAgreement = 0;
    let comparisons = 0;

    // Compare each validator's emotional state with others
    for (let i = 0; i < proofs.length; i++) {
      for (let j = i + 1; j < proofs.length; j++) {
        const proof1 = proofs[i];
        const proof2 = proofs[j];
        
        // Calculate similarity in each dimension (0-1 scale)
        const stressSimilarity = 1 - Math.abs(proof1.stressLevel - proof2.stressLevel) / 100;
        const energySimilarity = 1 - Math.abs(proof1.energyLevel - proof2.energyLevel) / 100;
        const focusSimilarity = 1 - Math.abs(proof1.focusLevel - proof2.focusLevel) / 100;
        
        // Weight by stake
        const combinedStake = proof1.stake + proof2.stake;
        const avgSimilarity = (stressSimilarity + energySimilarity + focusSimilarity) / 3;
        
        totalAgreement += avgSimilarity * combinedStake;
        comparisons += combinedStake;
      }
    }

    return comparisons > 0 ? (totalAgreement / comparisons) * 100 : 0;
  }

  // Get valid emotional proofs within time window
  getValidEmotionalProofs() {
    const now = Date.now();
    const validProofs = [];

    this.emotionalProofs.forEach((proof, validator) => {
      if (now - proof.timestamp <= this.validationWindow) {
        const validatorData = this.validators.get(validator);
        if (validatorData && validatorData.isActive) {
          validProofs.push(proof);
        }
      }
    });

    return validProofs;
  }

  // Reward calculation for PoE validators
  calculateValidatorReward(validatorAddress, consensus) {
    const validator = this.validators.get(validatorAddress);
    const proof = this.emotionalProofs.get(validatorAddress);
    
    if (!validator || !proof) return 0;

    let reward = 50; // Base block reward

    // Stability bonus: Lower stress = higher reward
    if (proof.stressLevel < 30) reward += 25;

    // Network health bonus: If validator helped improve network state
    if (this.improvedNetworkHealth(proof, consensus)) reward += 100;

    // Authenticity bonus
    if (proof.authenticityScore > 95) reward += 15;

    // Participation bonus
    if (consensus.participatingValidators >= this.minValidators * 2) reward += 10;

    console.log(`💰 Validator ${validatorAddress} reward: ${reward} EMOTION tokens`);
    return reward;
  }

  // Check if validator improved network emotional health
  improvedNetworkHealth(proof, consensus) {
    if (this.consensusHistory.length < 2) return false;
    
    const previousConsensus = this.consensusHistory[this.consensusHistory.length - 2];
    
    // Check if this validator's emotional state was better than previous network average
    const wasLessStressed = proof.stressLevel < previousConsensus.networkStress;
    const hadMoreEnergy = proof.energyLevel > previousConsensus.networkEnergy;
    const wasBetterFocused = proof.focusLevel > previousConsensus.networkFocus;
    
    return (wasLessStressed && hadMoreEnergy) || wasBetterFocused;
  }

  // Utility functions
  hashBiometricData(data) {
    const dataString = JSON.stringify({
      heartRate: data.heartRate,
      hrv: data.hrv,
      timestamp: data.timestamp
    });
    
    // Simple hash function for demo
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  signEmotionalProof(validator, metrics) {
    return `poe_${validator}_${metrics.stress}_${metrics.energy}_${metrics.focus}_${Date.now()}`;
  }

  hasTemporalInconsistency(biometricData) {
    // Simple check for unrealistic temporal patterns
    return false; // Placeholder for more complex temporal analysis
  }

  // Get network statistics
  getNetworkStats() {
    const activeValidators = Array.from(this.validators.values()).filter(v => v.isActive);
    const recentConsensus = this.consensusHistory.slice(-5);
    
    return {
      totalValidators: activeValidators.length,
      totalStake: activeValidators.reduce((sum, v) => sum + v.stake, 0),
      recentConsensusRate: recentConsensus.filter(c => c.consensusReached).length / Math.max(recentConsensus.length, 1) * 100,
      averageNetworkStress: recentConsensus.reduce((sum, c) => sum + c.networkStress, 0) / Math.max(recentConsensus.length, 1),
      averageNetworkEnergy: recentConsensus.reduce((sum, c) => sum + c.networkEnergy, 0) / Math.max(recentConsensus.length, 1),
      averageNetworkFocus: recentConsensus.reduce((sum, c) => sum + c.networkFocus, 0) / Math.max(recentConsensus.length, 1)
    };
  }
}

// Demo usage and testing
async function demonstratePoE() {
  console.log("🚀 Starting Proof of Emotion (PoE) Demo\n");
  
  const poe = new ProofOfEmotion();
  
  // Register validators
  await poe.registerValidator("validator_alice", 15000, "FitbitDevice_001");
  await poe.registerValidator("validator_bob", 12000, "AppleWatch_002");
  await poe.registerValidator("validator_charlie", 20000, "SamsungWatch_003");
  
  console.log("\n📊 Simulating real biometric data and emotional proofs...\n");
  
  // Generate emotional proofs from simulated real biometric data
  const aliceBiometrics = {
    heartRate: 72,
    hrv: 45,
    skinConductance: 0.3,
    movement: 0.1,
    timestamp: Date.now()
  };
  
  const bobBiometrics = {
    heartRate: 95,
    hrv: 25,
    skinConductance: 0.8,
    movement: 0.4,
    timestamp: Date.now()
  };
  
  const charlieBiometrics = {
    heartRate: 68,
    hrv: 55,
    skinConductance: 0.2,
    movement: 0.05,
    timestamp: Date.now()
  };
  
  // Generate proofs
  await poe.generateEmotionalProof("validator_alice", aliceBiometrics);
  await poe.generateEmotionalProof("validator_bob", bobBiometrics);
  await poe.generateEmotionalProof("validator_charlie", charlieBiometrics);
  
  console.log("\n🧠 Calculating Proof of Emotion consensus...\n");
  
  // Calculate consensus for block
  const consensus1 = await poe.calculatePoEConsensus(1);
  
  console.log("\n💰 Calculating validator rewards...\n");
  
  // Calculate rewards
  const aliceReward = poe.calculateValidatorReward("validator_alice", consensus1);
  const bobReward = poe.calculateValidatorReward("validator_bob", consensus1);
  const charlieReward = poe.calculateValidatorReward("validator_charlie", consensus1);
  
  console.log("\n📈 Network Statistics:");
  const stats = poe.getNetworkStats();
  console.log(`   Active Validators: ${stats.totalValidators}`);
  console.log(`   Total Stake: ${stats.totalStake.toLocaleString()} EMOTION`);
  console.log(`   Recent Consensus Rate: ${stats.recentConsensusRate.toFixed(1)}%`);
  console.log(`   Average Network Stress: ${stats.averageNetworkStress.toFixed(1)}%`);
  console.log(`   Average Network Energy: ${stats.averageNetworkEnergy.toFixed(1)}%`);
  console.log(`   Average Network Focus: ${stats.averageNetworkFocus.toFixed(1)}%`);
  
  console.log("\n🎉 Proof of Emotion consensus successfully demonstrated!");
  
  return poe;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProofOfEmotion, demonstratePoE };
}

// Auto-run demo if this file is executed directly
if (typeof window === 'undefined') {
  demonstratePoE().catch(console.error);
}