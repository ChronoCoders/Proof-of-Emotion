const exampleTests = `
// tests/blockchain.test.ts
import { EmotionalChain, BiometricData, EmotionalValidator } from '../src/blockchain/EmotionalChain';

describe('EmotionalChain', () => {
  let blockchain: EmotionalChain;

  beforeEach(() => {
    blockchain = new EmotionalChain();
  });

  test('should create genesis block', () => {
    const chain = blockchain.getChain();
    expect(chain.length).toBe(1);
    expect(chain[0].index).toBe(0);
    expect(chain[0].previousHash).toBe('0');
  });

  test('should validate chain', () => {
    expect(blockchain.validateChain()).toBe(true);
  });

  test('should register validator', () => {
    const validator: EmotionalValidator = {
      id: 'test_validator',
      publicKey: 'test_pubkey',
      stake: 5000,
      emotionalConsistency: 0.85,
      uptime: 0.95,
      reputation: 0.8,
      biometricProfile: {
        baselineHeartRate: 72,
        emotionalRange: {
          joy: 0.7, sadness: 0.1, anger: 0.05, fear: 0.1,
          surprise: 0.1, disgust: 0.05, neutral: 0.0, confidence: 0.8
        },
        stressThreshold: 0.3,
        authenticityScore: 0.88
      },
      lastValidation: Date.now()
    };

    const result = blockchain.registerValidator(validator);
    expect(result).toBe(true);
  });

  test('should generate test biometric data', () => {
    // This would be in the wallet test file
    const biometricData: BiometricData = {
      heartRate: 75,
      heartRateVariability: 45,
      facialExpression: {
        joy: 0.8, sadness: 0.1, anger: 0.05, fear: 0.05,
        surprise: 0.1, disgust: 0.0, neutral: 0.0, confidence: 0.9
      },
      voiceStress: 0.2,
      galvanicSkinResponse: 0.3,
      eyeTracking: {
        pupilDilation: 3.5,
        gazePattern: [0.5, 0.6, 0.4],
        blinkRate: 15,
        fixationDuration: 250
      },
      timestamp: Date.now(),
      deviceSignature: 'test_device'
    };

    expect(biometricData.heartRate).toBeGreaterThan(0);
    expect(biometricData.facialExpression.confidence).toBeGreaterThan(0.5);
  });
});
`;
