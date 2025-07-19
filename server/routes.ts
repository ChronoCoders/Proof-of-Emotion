import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { poeAlgorithm } from "./services/poe-algorithm";
import { fitbitService } from "./services/fitbit-service";
import { websocketService } from "./services/websocket-service";
import { insertValidatorSchema } from "../shared/schema";

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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/validators', async (req, res) => {
    try {
      const validators = await storage.getActiveValidators();
      res.json(validators);
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/emotional-proofs/valid', async (req, res) => {
    try {
      const proofs = await storage.getValidEmotionalProofs(poeAlgorithm.validationWindow);
      res.json(proofs);
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/consensus', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const blocks = await storage.getLatestConsensusBlocks(limit);
      res.json(blocks);
    } catch (error: any) {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Network Statistics Routes
  app.get('/api/network/stats', async (req, res) => {
    try {
      const stats = await storage.getNetworkStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/network/activity', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getRecentNetworkActivity(limit);
      res.json(activities);
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Data Export Routes for External Systems
  app.get('/api/export/validators', async (req, res) => {
    try {
      const format = req.query.format || 'json';
      const validators = await storage.getActiveValidators();
      
      if (format === 'csv') {
        const csvHeader = 'id,address,stake,biometricDevice,joinedAt,reputation,isActive\n';
        const csvData = validators.map(v => 
          `${v.id},${v.address},${v.stake},${v.biometricDevice},${v.joinedAt},${v.reputation},${v.isActive}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="validators_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeader + csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="validators_${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          exportDate: new Date().toISOString(),
          totalValidators: validators.length,
          data: validators
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/export/consensus', async (req, res) => {
    try {
      const format = req.query.format || 'json';
      const limit = parseInt(req.query.limit as string) || 100;
      const blocks = await storage.getLatestConsensusBlocks(limit);
      
      if (format === 'csv') {
        const csvHeader = 'id,blockHeight,timestamp,networkStress,networkEnergy,networkFocus,networkAuthenticity,agreementScore,participatingValidators,totalStake,consensusReached\n';
        const csvData = blocks.map(b => 
          `${b.id},${b.blockHeight},${b.timestamp},${b.networkStress},${b.networkEnergy},${b.networkFocus},${b.networkAuthenticity},${b.agreementScore},${b.participatingValidators},${b.totalStake},${b.consensusReached}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="consensus_blocks_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeader + csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="consensus_blocks_${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          exportDate: new Date().toISOString(),
          totalBlocks: blocks.length,
          data: blocks
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/export/emotional-proofs', async (req, res) => {
    try {
      const format = req.query.format || 'json';
      const proofs = await storage.getValidEmotionalProofs(poeAlgorithm.validationWindow * 10); // Extended window for export
      
      if (format === 'csv') {
        const csvHeader = 'id,validatorAddress,timestamp,heartRate,hrv,stressLevel,energyLevel,focusLevel,authenticityScore\n';
        const csvData = proofs.map(p => 
          `${p.id},${p.validatorAddress},${p.timestamp},${p.heartRate},${p.hrv || 'N/A'},${p.stressLevel},${p.energyLevel},${p.focusLevel},${p.authenticityScore}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="emotional_proofs_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeader + csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="emotional_proofs_${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          exportDate: new Date().toISOString(),
          totalProofs: proofs.length,
          data: proofs
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/export/network-analytics', async (req, res) => {
    try {
      const format = req.query.format || 'json';
      const stats = await storage.getNetworkStats();
      const activities = await storage.getRecentNetworkActivity(1000);
      const validators = await storage.getActiveValidators();
      const blocks = await storage.getLatestConsensusBlocks(50);
      
      const analyticsData = {
        networkStats: stats,
        validators,
        recentBlocks: blocks,
        networkActivity: activities,
        exportMetadata: {
          exportDate: new Date().toISOString(),
          totalValidators: validators.length,
          totalBlocks: blocks.length,
          totalActivities: activities.length
        }
      };
      
      if (format === 'csv') {
        // For CSV, we'll export just the network stats summary
        const csvData = [
          'metric,value',
          `totalValidators,${stats.totalValidators}`,
          `totalStake,${stats.totalStake}`,
          `recentConsensusRate,${stats.recentConsensusRate}`,
          `averageNetworkStress,${stats.averageNetworkStress}`,
          `averageNetworkEnergy,${stats.averageNetworkEnergy}`,
          `averageNetworkFocus,${stats.averageNetworkFocus}`,
          `exportDate,${new Date().toISOString()}`
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="network_analytics_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="network_analytics_${new Date().toISOString().split('T')[0]}.json"`);
        res.json(analyticsData);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ML Engine Status and Testing Routes
  app.get('/api/ml/status', async (req, res) => {
    try {
      const mlStats = poeAlgorithm.getMLEngineStats();
      res.json({
        status: 'success',
        ml_engine: mlStats,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/ml/test-emotion', async (req, res) => {
    try {
      const { biometricData } = req.body;
      
      if (!biometricData) {
        return res.status(400).json({ message: 'Biometric data required' });
      }

      // Test emotion classification without creating proof
      const testData = {
        heartRate: biometricData.heartRate || 70,
        hrv: biometricData.hrv || 30,
        skinConductance: biometricData.skinConductance || 0.5,
        movement: biometricData.movement || 0.1,
        timestamp: Date.now()
      };

      // Use the new ML test method (will try ML first, fallback to rule-based)
      const metrics = await poeAlgorithm.testMLClassification(testData);
      
      res.json({
        status: 'success',
        input_data: testData,
        emotional_metrics: metrics,
        ml_engine_enabled: poeAlgorithm.isMLEngineEnabled(),
        processing_method: poeAlgorithm.isMLEngineEnabled() ? 'ML' : 'Rule-based',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/ml/train', async (req, res) => {
    try {
      res.json({
        status: 'info',
        message: 'ML training should be done offline using Python scripts',
        training_script: 'ml-engine/train_models.py',
        data_generator: 'ml-engine/training_data/generate_data.py',
        instructions: [
          '1. cd ml-engine',
          '2. python training_data/generate_data.py',
          '3. python train_models.py',
          '4. Restart EmotionalChain server'
        ]
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced ML Testing Route - Live Demo
  app.post('/api/ml/demo', async (req, res) => {
    try {
      const demoScenarios = [
        {
          name: 'Calm State',
          data: { heartRate: 65, hrv: 50, skinConductance: 0.2, movement: 0.05 }
        },
        {
          name: 'Stressed State', 
          data: { heartRate: 120, hrv: 15, skinConductance: 0.9, movement: 0.4 }
        },
        {
          name: 'Focused State',
          data: { heartRate: 78, hrv: 45, skinConductance: 0.35, movement: 0.03 }
        },
        {
          name: 'Excited State',
          data: { heartRate: 95, hrv: 30, skinConductance: 0.65, movement: 0.5 }
        }
      ];

      const results = [];
      
      for (const scenario of demoScenarios) {
        const testData = { ...scenario.data, timestamp: Date.now() };
        const metrics = await poeAlgorithm.testMLClassification(testData);
        
        results.push({
          scenario: scenario.name,
          input: testData,
          output: metrics
        });
      }

      res.json({
        status: 'success',
        demo_results: results,
        ml_engine_enabled: poeAlgorithm.isMLEngineEnabled(),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}