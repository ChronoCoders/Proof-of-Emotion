import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { poeAlgorithm } from "./services/poe-algorithm";
import { fitbitService } from "./services/fitbit-service";
import { websocketService } from "./services/websocket-service";
import { insertValidatorSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  websocketService.initialize(httpServer);

  // PoE Network Routes
  app.post('/api/validators', async (req, res) => {
    try {
      const validatorData = insertValidatorSchema.parse(req.body);
      const validator = await poeAlgorithm.registerValidator(
        validatorData.address,
        validatorData.stake,
        validatorData.biometricDevice
      );
      
      websocketService.broadcastValidatorUpdate(validator);
      res.json(validator);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/validators', async (req, res) => {
    try {
      const validators = await storage.getActiveValidators();
      res.json(validators);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/validators/:address', async (req, res) => {
    try {
      const validator = await storage.getValidator(req.params.address);
      if (!validator) {
        return res.status(404).json({ message: 'Validator not found' });
      }
      res.json(validator);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Emotional Proof Routes
  app.post('/api/emotional-proofs', async (req, res) => {
    try {
      const { validatorAddress, biometricData } = req.body;
      const proof = await poeAlgorithm.generateEmotionalProof(validatorAddress, biometricData);
      
      websocketService.broadcastEmotionalProof(proof);
      res.json(proof);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/emotional-proofs/valid', async (req, res) => {
    try {
      const proofs = await storage.getValidEmotionalProofs(poeAlgorithm.validationWindow);
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/emotional-proofs/validator/:address', async (req, res) => {
    try {
      const proof = await storage.getLatestProofByValidator(req.params.address);
      if (!proof) {
        return res.status(404).json({ message: 'No proof found for validator' });
      }
      res.json(proof);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Consensus Routes
  app.post('/api/consensus/:blockHeight', async (req, res) => {
    try {
      const blockHeight = parseInt(req.params.blockHeight);
      const consensus = await poeAlgorithm.calculatePoEConsensus(blockHeight);
      
      websocketService.broadcastConsensusResult(consensus);
      res.json(consensus);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/consensus', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const blocks = await storage.getLatestConsensusBlocks(limit);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/consensus/:blockHeight', async (req, res) => {
    try {
      const blockHeight = parseInt(req.params.blockHeight);
      const block = await storage.getConsensusBlock(blockHeight);
      if (!block) {
        return res.status(404).json({ message: 'Consensus block not found' });
      }
      res.json(block);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Network Statistics Routes
  app.get('/api/network/stats', async (req, res) => {
    try {
      const stats = await storage.getNetworkStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/network/activity', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getRecentNetworkActivity(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Fitbit OAuth Routes
  app.get('/api/auth/fitbit', (req, res) => {
    try {
      const { validatorAddress } = req.query;
      if (!validatorAddress) {
        return res.status(400).json({ message: 'Validator address required' });
      }
      
      const authUrl = fitbitService.getAuthUrl(validatorAddress as string);
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/auth/fitbit/callback', async (req, res) => {
    try {
      const { code, state: validatorAddress } = req.query;
      
      if (!code || !validatorAddress) {
        return res.status(400).send('Missing authorization code or validator address');
      }

      const tokens = await fitbitService.exchangeCodeForTokens(code as string);
      await storage.updateValidatorTokens(
        validatorAddress as string,
        tokens.accessToken,
        tokens.refreshToken,
        tokens.userId
      );

      await storage.createNetworkActivity({
        type: 'fitbit_connected',
        message: `Fitbit connected for validator ${validatorAddress}`,
        metadata: { validatorAddress, userId: tokens.userId }
      });

      res.redirect('/?fitbit=connected');
    } catch (error) {
      console.error('Fitbit OAuth error:', error);
      res.redirect('/?fitbit=error');
    }
  });

  // Biometric Data Routes
  app.get('/api/biometric/:validatorAddress', async (req, res) => {
    try {
      const { validatorAddress } = req.params;
      const validator = await storage.getValidator(validatorAddress);
      
      if (!validator || !validator.fitbitAccessToken) {
        return res.status(404).json({ message: 'Validator not found or Fitbit not connected' });
      }

      const biometricData = await fitbitService.getCurrentBiometricData(validator.fitbitAccessToken);
      const hrv = await fitbitService.getHeartRateVariability(validator.fitbitAccessToken);
      
      const enrichedData = {
        ...biometricData,
        hrv,
        skinConductance: 0.3 + Math.random() * 0.4, // Simulated since not available from Fitbit
        movement: Math.random() * 0.5 // Simulated based on activity
      };

      websocketService.broadcastBiometricUpdate({ validatorAddress, data: enrichedData });
      res.json(enrichedData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/biometric/:validatorAddress/sync', async (req, res) => {
    try {
      const { validatorAddress } = req.params;
      const validator = await storage.getValidator(validatorAddress);
      
      if (!validator || !validator.fitbitAccessToken) {
        return res.status(404).json({ message: 'Validator not found or Fitbit not connected' });
      }

      const biometricData = await fitbitService.getCurrentBiometricData(validator.fitbitAccessToken);
      const hrv = await fitbitService.getHeartRateVariability(validator.fitbitAccessToken);
      
      const enrichedData = {
        ...biometricData,
        hrv,
        skinConductance: 0.3 + Math.random() * 0.4,
        movement: Math.random() * 0.5
      };

      // Generate emotional proof with real data
      const proof = await poeAlgorithm.generateEmotionalProof(validatorAddress, enrichedData);
      
      websocketService.broadcastEmotionalProof(proof);
      websocketService.broadcastBiometricUpdate({ validatorAddress, data: enrichedData });
      
      res.json({ biometricData: enrichedData, emotionalProof: proof });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Testing Routes
  app.post('/api/testing/stress-test', async (req, res) => {
    try {
      const { rounds = 10, validatorCount = 5 } = req.body;
      const results = [];
      
      for (let i = 0; i < rounds; i++) {
        // Simulate biometric data for stress test
        const validators = await storage.getActiveValidators();
        const selectedValidators = validators.slice(0, Math.min(validatorCount, validators.length));
        
        for (const validator of selectedValidators) {
          const mockBiometric = {
            heartRate: 60 + Math.floor(Math.random() * 40),
            hrv: 20 + Math.floor(Math.random() * 50),
            skinConductance: 0.2 + Math.random() * 0.6,
            movement: Math.random() * 0.8,
            timestamp: Date.now()
          };
          
          await poeAlgorithm.generateEmotionalProof(validator.address, mockBiometric);
        }
        
        const consensus = await poeAlgorithm.calculatePoEConsensus(1000 + i);
        results.push(consensus);
        
        // Small delay between rounds
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await storage.createNetworkActivity({
        type: 'stress_test',
        message: `Stress test completed: ${rounds} rounds with ${validatorCount} validators`,
        metadata: { rounds, validatorCount, results: results.length }
      });
      
      res.json({ message: 'Stress test completed', results });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
