import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWebSocket } from './use-websocket';
import { toast } from './use-toast';

export function usePoENetwork() {
  const queryClient = useQueryClient();
  const { lastMessage, isConnected } = useWebSocket();
  const [currentBlockHeight, setCurrentBlockHeight] = useState(1);

  // Queries
  const { data: validators = [], isLoading: validatorsLoading } = useQuery({
    queryKey: ['/api/validators'],
    refetchInterval: 30000,
  });

  const { data: networkStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/network/stats'],
    refetchInterval: 10000,
  });

  const { data: consensusBlocks = [], isLoading: consensusLoading } = useQuery({
    queryKey: ['/api/consensus'],
    refetchInterval: 15000,
  });

  const { data: networkActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['/api/network/activity'],
    refetchInterval: 5000,
  });

  // Mutations
  const createValidatorMutation = useMutation({
    mutationFn: api.createValidator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/validators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/network/stats'] });
      toast({
        title: "Validator Registered",
        description: "New validator has been successfully registered.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const runConsensusMutation = useMutation({
    mutationFn: (blockHeight: number) => api.runConsensus(blockHeight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consensus'] });
      queryClient.invalidateQueries({ queryKey: ['/api/network/stats'] });
      setCurrentBlockHeight(prev => prev + 1);
      toast({
        title: "Consensus Complete",
        description: "PoE consensus has been calculated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Consensus Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncBiometricMutation = useMutation({
    mutationFn: api.syncBiometricData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/validators'] });
      toast({
        title: "Biometric Sync Complete",
        description: "Fitbit data has been synchronized successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stressTestMutation = useMutation({
    mutationFn: ({ rounds, validatorCount }: { rounds: number; validatorCount: number }) =>
      api.runStressTest(rounds, validatorCount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consensus'] });
      queryClient.invalidateQueries({ queryKey: ['/api/network/stats'] });
      toast({
        title: "Stress Test Complete",
        description: "Network stress test has been completed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Stress Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'network_stats':
        queryClient.setQueryData(['/api/network/stats'], lastMessage.data);
        break;
      case 'validator_update':
        queryClient.invalidateQueries({ queryKey: ['/api/validators'] });
        break;
      case 'consensus_result':
        queryClient.invalidateQueries({ queryKey: ['/api/consensus'] });
        queryClient.invalidateQueries({ queryKey: ['/api/network/stats'] });
        toast({
          title: "New Consensus",
          description: `Block ${lastMessage.data.blockHeight} ${lastMessage.data.consensusReached ? 'reached' : 'failed'} consensus`,
        });
        break;
      case 'emotional_proof':
        queryClient.invalidateQueries({ queryKey: ['/api/validators'] });
        break;
      case 'network_activity':
        queryClient.invalidateQueries({ queryKey: ['/api/network/activity'] });
        break;
      case 'biometric_update':
        queryClient.invalidateQueries({ queryKey: ['/api/validators'] });
        break;
    }
  }, [lastMessage, queryClient]);

  // Helper functions
  const initializeNetwork = async () => {
    try {
      // Register some initial validators for testing
      const testValidators = [
        { address: 'validator_alice', stake: 25000, biometricDevice: 'FitbitDevice_001' },
        { address: 'validator_bob', stake: 18500, biometricDevice: 'AppleWatch_002' },
        { address: 'validator_charlie', stake: 32000, biometricDevice: 'SamsungWatch_003' },
      ];

      for (const validator of testValidators) {
        await createValidatorMutation.mutateAsync(validator);
      }

      toast({
        title: "Network Initialized",
        description: "PoE network has been initialized with test validators.",
      });
    } catch (error) {
      console.error('Failed to initialize network:', error);
    }
  };

  const simulateRealData = async () => {
    try {
      // Simulate biometric data for all active validators
      for (const validator of validators) {
        const mockBiometric = {
          heartRate: 60 + Math.floor(Math.random() * 40),
          hrv: 20 + Math.floor(Math.random() * 50),
          skinConductance: 0.2 + Math.random() * 0.6,
          movement: Math.random() * 0.8,
          timestamp: Date.now()
        };

        await api.createEmotionalProof(validator.address, mockBiometric);
      }

      queryClient.invalidateQueries({ queryKey: ['/api/validators'] });
      toast({
        title: "Biometric Data Simulated",
        description: "Real biometric data has been simulated for all validators.",
      });
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: "Failed to simulate biometric data.",
        variant: "destructive",
      });
    }
  };

  const connectFitbit = async (validatorAddress: string) => {
    try {
      const { authUrl } = await api.getFitbitAuthUrl(validatorAddress);
      window.open(authUrl, '_blank');
    } catch (error) {
      toast({
        title: "Fitbit Connection Failed",
        description: "Failed to initiate Fitbit OAuth flow.",
        variant: "destructive",
      });
    }
  };

  return {
    // Data
    validators,
    networkStats,
    consensusBlocks,
    networkActivity,
    currentBlockHeight,
    isConnected,
    
    // Loading states
    validatorsLoading,
    statsLoading,
    consensusLoading,
    activityLoading,
    
    // Mutations
    createValidator: createValidatorMutation.mutate,
    runConsensus: () => runConsensusMutation.mutate(currentBlockHeight),
    syncBiometric: syncBiometricMutation.mutate,
    runStressTest: stressTestMutation.mutate,
    
    // Loading states for mutations
    isCreatingValidator: createValidatorMutation.isPending,
    isRunningConsensus: runConsensusMutation.isPending,
    isSyncingBiometric: syncBiometricMutation.isPending,
    isRunningStressTest: stressTestMutation.isPending,
    
    // Helper functions
    initializeNetwork,
    simulateRealData,
    connectFitbit,
  };
}
