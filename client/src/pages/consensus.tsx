import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConsensusBlock {
  id: number;
  blockHeight: number;
  timestamp: Date;
  networkStress: number;
  networkEnergy: number;
  networkFocus: number;
  networkAuthenticity: number;
  agreementScore: number;
  participatingValidators: number;
  totalStake: number;
  consensusReached: boolean;
  validatorProofs: any;
}

interface EmotionalState {
  stress: number;
  energy: number;
  focus: number;
  authenticity: number;
}

interface ConsensusSimulation {
  validators: Array<{
    address: string;
    stake: number;
    emotionalState: EmotionalState;
  }>;
  predictedOutcome: {
    consensus: boolean;
    timeToConsensus: number;
    agreementScore: number;
  };
}

export default function ConsensusPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage, isConnected } = useWebSocket();
  
  const [currentConsensus, setCurrentConsensus] = useState<any>(null);
  const [consensusProgress, setConsensusProgress] = useState(0);
  const [isRunningConsensus, setIsRunningConsensus] = useState(false);
  const [simulationForm, setSimulationForm] = useState({
    blockHeight: '',
    validatorCount: '5'
  });
  const [simulationResults, setSimulationResults] = useState<ConsensusSimulation | null>(null);

  // Queries
  const { data: consensusBlocks = [], isLoading: blocksLoading, refetch: refetchBlocks } = useQuery({
    queryKey: ['/api/consensus'],
    refetchInterval: 5000,
  });

  const { data: validators = [] } = useQuery({
    queryKey: ['/api/validators'],
    refetchInterval: 10000,
  });

  const { data: networkStats } = useQuery({
    queryKey: ['/api/network/stats'],
    refetchInterval: 5000,
  });

  // Mutations
  const runConsensusMutation = useMutation({
    mutationFn: (blockHeight: number) => api.runConsensus(blockHeight),
    onMutate: () => {
      setIsRunningConsensus(true);
      setConsensusProgress(0);
    },
    onSuccess: (data) => {
      setCurrentConsensus(data);
      setConsensusProgress(100);
      queryClient.invalidateQueries({ queryKey: ['/api/consensus'] });
      toast({
        title: "Consensus Complete",
        description: `Block ${data.blockHeight} consensus ${data.consensusReached ? 'reached' : 'failed'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Consensus Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRunningConsensus(false);
    },
  });

  // Handle WebSocket updates
  useEffect(() => {
    if (lastMessage?.type === 'consensus_result') {
      setCurrentConsensus(lastMessage.data);
      refetchBlocks();
    }
  }, [lastMessage, refetchBlocks]);

  // Simulate consensus progress
  useEffect(() => {
    if (isRunningConsensus && consensusProgress < 95) {
      const timer = setTimeout(() => {
        setConsensusProgress(prev => Math.min(prev + Math.random() * 15, 95));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isRunningConsensus, consensusProgress]);

  const runConsensusTest = () => {
    const blockHeight = parseInt(simulationForm.blockHeight) || Date.now();
    runConsensusMutation.mutate(blockHeight);
  };

  const runStressTest = async () => {
    try {
      const result = await api.runStressTest(10, parseInt(simulationForm.validatorCount));
      toast({
        title: "Stress Test Complete",
        description: `Completed ${result.results.length} consensus rounds`,
      });
      refetchBlocks();
    } catch (error: any) {
      toast({
        title: "Stress Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getConsensusStatusColor = (reached: boolean, score: number) => {
    if (!reached) return 'bg-red-500';
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getEmotionalHealthColor = (value: number) => {
    if (value >= 80) return 'text-emerald-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (blocksLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-400 mb-4"></i>
          <p className="text-gray-400">Loading consensus data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Emotional Consensus Engine
            </h1>
            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
              PoE v1.0
            </Badge>
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-gray-400">
                {isConnected ? 'Consensus Network Active' : 'Network Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={runConsensusTest}
              disabled={isRunningConsensus}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isRunningConsensus ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Running Consensus...
                </>
              ) : (
                <>
                  <i className="fas fa-brain mr-2"></i>
                  Run Consensus
                </>
              )}
            </Button>
            <Button
              onClick={runStressTest}
              variant="outline"
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
            >
              <i className="fas fa-bolt mr-2"></i>
              Stress Test
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Real-time Consensus Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-600 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-heartbeat text-purple-400"></i>
                <span>Live Consensus Monitor</span>
              </CardTitle>
              <CardDescription>
                Real-time emotional consensus calculation with 67% threshold
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Consensus Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Consensus Progress</span>
                  <span className="text-lg font-mono text-purple-400">{consensusProgress.toFixed(1)}%</span>
                </div>
                <Progress value={consensusProgress} className="h-3" />
                
                {currentConsensus && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Emotional Agreement</div>
                      <div className={`text-2xl font-bold ${currentConsensus.agreementScore >= 67 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Math.round(currentConsensus.agreementScore)}%
                      </div>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Participating Validators</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {currentConsensus.participatingValidators}
                      </div>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Block Height</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        #{currentConsensus.blockHeight}
                      </div>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Status</div>
                      <div className={`text-lg font-bold ${currentConsensus.consensusReached ? 'text-emerald-400' : 'text-red-400'}`}>
                        {currentConsensus.consensusReached ? 'REACHED' : 'FAILED'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-600">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-brain text-pink-400"></i>
                <span>Network Emotional State</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentConsensus ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Network Stress</span>
                      <span className={`font-mono ${getEmotionalHealthColor(100 - currentConsensus.networkStress)}`}>
                        {Math.round(currentConsensus.networkStress)}%
                      </span>
                    </div>
                    <Progress value={currentConsensus.networkStress} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Network Energy</span>
                      <span className={`font-mono ${getEmotionalHealthColor(currentConsensus.networkEnergy)}`}>
                        {Math.round(currentConsensus.networkEnergy)}%
                      </span>
                    </div>
                    <Progress value={currentConsensus.networkEnergy} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Network Focus</span>
                      <span className={`font-mono ${getEmotionalHealthColor(currentConsensus.networkFocus)}`}>
                        {Math.round(currentConsensus.networkFocus)}%
                      </span>
                    </div>
                    <Progress value={currentConsensus.networkFocus} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Authenticity</span>
                      <span className={`font-mono ${getEmotionalHealthColor(currentConsensus.networkAuthenticity)}`}>
                        {Math.round(currentConsensus.networkAuthenticity)}%
                      </span>
                    </div>
                    <Progress value={currentConsensus.networkAuthenticity} className="h-2" />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-brain text-4xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400">No active consensus data</p>
                  <p className="text-xs text-gray-500">Run consensus to see emotional state</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-600">
            <TabsTrigger value="timeline" className="data-[state=active]:bg-purple-600">
              Block Timeline
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              Consensus Analytics
            </TabsTrigger>
            <TabsTrigger value="simulation" className="data-[state=active]:bg-purple-600">
              Consensus Simulation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            <Card className="bg-slate-800 border-slate-600">
              <CardHeader>
                <CardTitle>Emotional Consensus Timeline</CardTitle>
                <CardDescription>
                  Chronological view of consensus blocks with emotional metadata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consensusBlocks.length > 0 ? (
                    consensusBlocks.slice(0, 10).map((block: ConsensusBlock, index: number) => (
                      <div key={block.id} className="flex items-center space-x-4 p-4 bg-slate-700 rounded-lg">
                        <div className={`w-4 h-4 rounded-full ${getConsensusStatusColor(block.consensusReached, block.agreementScore)}`}></div>
                        
                        <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                          <div>
                            <div className="text-sm font-mono text-yellow-400">#{block.blockHeight}</div>
                            <div className="text-xs text-gray-400">{formatTimestamp(block.timestamp)}</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-mono text-purple-400">{Math.round(block.agreementScore)}%</div>
                            <div className="text-xs text-gray-400">Agreement</div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-sm font-mono ${getEmotionalHealthColor(100 - block.networkStress)}`}>
                              {Math.round(block.networkStress)}%
                            </div>
                            <div className="text-xs text-gray-400">Stress</div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-sm font-mono ${getEmotionalHealthColor(block.networkEnergy)}`}>
                              {Math.round(block.networkEnergy)}%
                            </div>
                            <div className="text-xs text-gray-400">Energy</div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-sm font-mono ${getEmotionalHealthColor(block.networkFocus)}`}>
                              {Math.round(block.networkFocus)}%
                            </div>
                            <div className="text-xs text-gray-400">Focus</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-mono text-blue-400">{block.participatingValidators}</div>
                            <div className="text-xs text-gray-400">Validators</div>
                          </div>
                        </div>
                        
                        <Badge variant={block.consensusReached ? "default" : "destructive"}>
                          {block.consensusReached ? "SUCCESS" : "FAILED"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <i className="fas fa-cube text-4xl text-gray-600 mb-4"></i>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">No Consensus Blocks</h3>
                      <p className="text-gray-400 mb-6">
                        Run your first emotional consensus to see the block timeline.
                      </p>
                      <Button onClick={runConsensusTest} className="bg-purple-600 hover:bg-purple-700">
                        <i className="fas fa-brain mr-2"></i>
                        Start Consensus
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-600">
                <CardHeader>
                  <CardTitle>Consensus Success Rate</CardTitle>
                  <CardDescription>Emotional consensus performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {consensusBlocks.length > 0 ? (
                      (() => {
                        const successRate = (consensusBlocks.filter((b: ConsensusBlock) => b.consensusReached).length / consensusBlocks.length) * 100;
                        const avgAgreement = consensusBlocks.reduce((sum: number, b: ConsensusBlock) => sum + b.agreementScore, 0) / consensusBlocks.length;
                        const avgValidators = consensusBlocks.reduce((sum: number, b: ConsensusBlock) => sum + b.participatingValidators, 0) / consensusBlocks.length;
                        
                        return (
                          <>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-slate-700 rounded-lg">
                                <div className="text-2xl font-bold text-emerald-400">{successRate.toFixed(1)}%</div>
                                <div className="text-xs text-gray-400">Success Rate</div>
                              </div>
                              <div className="text-center p-4 bg-slate-700 rounded-lg">
                                <div className="text-2xl font-bold text-purple-400">{avgAgreement.toFixed(1)}%</div>
                                <div className="text-xs text-gray-400">Avg Agreement</div>
                              </div>
                              <div className="text-center p-4 bg-slate-700 rounded-lg">
                                <div className="text-2xl font-bold text-blue-400">{avgValidators.toFixed(1)}</div>
                                <div className="text-xs text-gray-400">Avg Validators</div>
                              </div>
                            </div>
                            <Progress value={successRate} className="h-2" />
                          </>
                        );
                      })()
                    ) : (
                      <div className="text-center py-8">
                        <i className="fas fa-chart-line text-4xl text-gray-600 mb-4"></i>
                        <p className="text-gray-400">No analytics data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-600">
                <CardHeader>
                  <CardTitle>Emotional Trends</CardTitle>
                  <CardDescription>Network emotional health patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  {consensusBlocks.length > 0 ? (
                    (() => {
                      const avgStress = consensusBlocks.reduce((sum: number, b: ConsensusBlock) => sum + b.networkStress, 0) / consensusBlocks.length;
                      const avgEnergy = consensusBlocks.reduce((sum: number, b: ConsensusBlock) => sum + b.networkEnergy, 0) / consensusBlocks.length;
                      const avgFocus = consensusBlocks.reduce((sum: number, b: ConsensusBlock) => sum + b.networkFocus, 0) / consensusBlocks.length;
                      const avgAuth = consensusBlocks.reduce((sum: number, b: ConsensusBlock) => sum + b.networkAuthenticity, 0) / consensusBlocks.length;
                      
                      return (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-400">Average Network Stress</span>
                              <span className={`font-mono ${getEmotionalHealthColor(100 - avgStress)}`}>
                                {avgStress.toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={avgStress} className="h-2" />
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-400">Average Network Energy</span>
                              <span className={`font-mono ${getEmotionalHealthColor(avgEnergy)}`}>
                                {avgEnergy.toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={avgEnergy} className="h-2" />
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-400">Average Network Focus</span>
                              <span className={`font-mono ${getEmotionalHealthColor(avgFocus)}`}>
                                {avgFocus.toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={avgFocus} className="h-2" />
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-400">Average Authenticity</span>
                              <span className={`font-mono ${getEmotionalHealthColor(avgAuth)}`}>
                                {avgAuth.toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={avgAuth} className="h-2" />
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-brain text-4xl text-gray-600 mb-4"></i>
                      <p className="text-gray-400">No emotional trend data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="simulation" className="space-y-6">
            <Card className="bg-slate-800 border-slate-600">
              <CardHeader>
                <CardTitle>Consensus Simulation</CardTitle>
                <CardDescription>
                  Test emotional consensus scenarios and network resilience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="blockHeight">Block Height</Label>
                      <Input
                        id="blockHeight"
                        type="number"
                        value={simulationForm.blockHeight}
                        onChange={(e) => setSimulationForm({ ...simulationForm, blockHeight: e.target.value })}
                        placeholder="Auto-generated if empty"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="validatorCount">Validator Count</Label>
                      <Input
                        id="validatorCount"
                        type="number"
                        min="3"
                        max="21"
                        value={simulationForm.validatorCount}
                        onChange={(e) => setSimulationForm({ ...simulationForm, validatorCount: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button
                      onClick={runConsensusTest}
                      disabled={isRunningConsensus}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isRunningConsensus ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Simulating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-brain mr-2"></i>
                          Run Single Consensus
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={runStressTest}
                      variant="outline"
                      className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                    >
                      <i className="fas fa-bolt mr-2"></i>
                      Run Stress Test (10 rounds)
                    </Button>
                  </div>
                </div>

                {/* Network Health Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">{validators.length}</div>
                    <div className="text-xs text-gray-400">Active Validators</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {((networkStats?.totalStake || 0) / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-400">Total Stake</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-400">67%</div>
                    <div className="text-xs text-gray-400">Consensus Threshold</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-400">~2.5s</div>
                    <div className="text-xs text-gray-400">Avg Consensus Time</div>
                  </div>
                </div>

                {/* Simulation Tips */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Simulation Tips</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• Emotional consensus requires 67% agreement among validators</li>
                    <li>• Higher authenticity scores carry more weight in consensus</li>
                    <li>• Network stress affects consensus speed and reliability</li>
                    <li>• Minimum 3 validators required for consensus calculation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}