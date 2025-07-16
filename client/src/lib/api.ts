import { apiRequest } from "./queryClient";

export const api = {
  // Validator operations
  async createValidator(data: { address: string; stake: number; biometricDevice: string }) {
    const response = await apiRequest('POST', '/api/validators', data);
    return response.json();
  },

  async getValidators() {
    const response = await apiRequest('GET', '/api/validators');
    return response.json();
  },

  async getValidator(address: string) {
    const response = await apiRequest('GET', `/api/validators/${address}`);
    return response.json();
  },

  // Emotional proof operations
  async createEmotionalProof(validatorAddress: string, biometricData: any) {
    const response = await apiRequest('POST', '/api/emotional-proofs', {
      validatorAddress,
      biometricData
    });
    return response.json();
  },

  async getValidEmotionalProofs() {
    const response = await apiRequest('GET', '/api/emotional-proofs/valid');
    return response.json();
  },

  async getValidatorProof(address: string) {
    const response = await apiRequest('GET', `/api/emotional-proofs/validator/${address}`);
    return response.json();
  },

  // Consensus operations
  async runConsensus(blockHeight: number) {
    const response = await apiRequest('POST', `/api/consensus/${blockHeight}`);
    return response.json();
  },

  async getConsensusBlocks(limit = 10) {
    const response = await apiRequest('GET', `/api/consensus?limit=${limit}`);
    return response.json();
  },

  async getConsensusBlock(blockHeight: number) {
    const response = await apiRequest('GET', `/api/consensus/${blockHeight}`);
    return response.json();
  },

  // Network operations
  async getNetworkStats() {
    const response = await apiRequest('GET', '/api/network/stats');
    return response.json();
  },

  async getNetworkActivity(limit = 50) {
    const response = await apiRequest('GET', `/api/network/activity?limit=${limit}`);
    return response.json();
  },

  // Fitbit operations
  async getFitbitAuthUrl(validatorAddress: string) {
    const response = await apiRequest('GET', `/api/auth/fitbit?validatorAddress=${validatorAddress}`);
    return response.json();
  },

  async getBiometricData(validatorAddress: string) {
    const response = await apiRequest('GET', `/api/biometric/${validatorAddress}`);
    return response.json();
  },

  async syncBiometricData(validatorAddress: string) {
    const response = await apiRequest('POST', `/api/biometric/${validatorAddress}/sync`);
    return response.json();
  },

  // Testing operations
  async runStressTest(rounds = 10, validatorCount = 5) {
    const response = await apiRequest('POST', '/api/testing/stress-test', {
      rounds,
      validatorCount
    });
    return response.json();
  }
};
