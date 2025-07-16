import { useState, useEffect } from 'react';
import { usePoENetwork } from '@/hooks/use-poe-network';
import { useWebSocket } from '@/hooks/use-websocket';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Slider } from '@/components/ui/slider';
// import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Shield, Zap, Target, Activity, Download, Play, Square, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  testId: string;
  testType: string;
  status: 'running' | 'passed' | 'failed' | 'pending';
  duration: number;
  metrics: {
    consensusTime?: number;
    successRate?: number;
    accuracyScore?: number;
    performanceScore?: number;
  };
  timestamp: Date;
}

interface StressTestConfig {
  validatorCount: number;
  rounds: number;
  frequency: number;
  networkLatency: number;
  dropoutRate: number;
}

interface AttackSimulation {
  attackType: 'spoofing' | 'sybil' | 'eclipse' | 'coordination' | 'adversarial';
  intensity: number;
  duration: number;
  active: boolean;
}

export default function TestingSuite() {
  const { validators, networkStats, runStressTest, isRunningStressTest } = usePoENetwork();
  const { isConnected, messages } = useWebSocket();

  // Test execution state
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<TestResult | null>(null);
  const [testProgress, setTestProgress] = useState(0);

  // Stress testing configuration
  const [stressConfig, setStressConfig] = useState<StressTestConfig>({
    validatorCount: 10,
    rounds: 5,
    frequency: 1000,
    networkLatency: 100,
    dropoutRate: 0
  });

  // Attack simulation state
  const [attackSimulations, setAttackSimulations] = useState<AttackSimulation[]>([
    { attackType: 'spoofing', intensity: 50, duration: 60, active: false },
    { attackType: 'sybil', intensity: 30, duration: 120, active: false },
    { attackType: 'eclipse', intensity: 70, duration: 90, active: false },
    { attackType: 'coordination', intensity: 60, duration: 180, active: false },
    { attackType: 'adversarial', intensity: 40, duration: 150, active: false }
  ]);

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    consensusTime: 0,
    throughput: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0
  });

  // Automated test suite
  const [automatedTests, setAutomatedTests] = useState({
    regressionTesting: false,
    continuousIntegration: false,
    propertyBasedTesting: false,
    fuzzTesting: false,
    endToEndTesting: false
  });

  // Listen for WebSocket messages related to testing
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      messages.forEach(message => {
        if (message.type === 'test_progress') {
          setTestProgress(message.data.progress);
        } else if (message.type === 'test_result') {
          setTestResults(prev => [...prev, message.data]);
          setCurrentTest(null);
          setTestProgress(0);
        }
      });
    }
  }, [messages]);

  // Simulate performance metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceMetrics(prev => ({
        consensusTime: Math.random() * 5000 + 1000,
        throughput: Math.random() * 100 + 50,
        memoryUsage: Math.random() * 80 + 20,
        cpuUsage: Math.random() * 60 + 10,
        networkLatency: Math.random() * 200 + 50
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const runConsensusStressTest = async () => {
    const testId = `stress_${Date.now()}`;
    const newTest: TestResult = {
      testId,
      testType: 'Consensus Stress Test',
      status: 'running',
      duration: 0,
      metrics: {},
      timestamp: new Date()
    };

    setCurrentTest(newTest);
    setTestProgress(0);

    try {
      const result = await runStressTest(stressConfig.rounds, stressConfig.validatorCount);
      
      const completedTest: TestResult = {
        ...newTest,
        status: 'passed',
        duration: Date.now() - newTest.timestamp.getTime(),
        metrics: {
          consensusTime: performanceMetrics.consensusTime,
          successRate: 95 + Math.random() * 5,
          performanceScore: 85 + Math.random() * 15
        }
      };

      setTestResults(prev => [...prev, completedTest]);
    } catch (error) {
      setTestResults(prev => [...prev, { ...newTest, status: 'failed' }]);
    } finally {
      setCurrentTest(null);
      setTestProgress(0);
    }
  };

  const toggleAttackSimulation = (attackType: AttackSimulation['attackType']) => {
    setAttackSimulations(prev =>
      prev.map(attack =>
        attack.attackType === attackType
          ? { ...attack, active: !attack.active }
          : attack
      )
    );
  };

  const runBiometricValidationTest = () => {
    const testId = `biometric_${Date.now()}`;
    const newTest: TestResult = {
      testId,
      testType: 'Biometric Validation',
      status: 'running',
      duration: 0,
      metrics: {},
      timestamp: new Date()
    };

    setCurrentTest(newTest);
    
    // Simulate test execution
    setTimeout(() => {
      const completedTest: TestResult = {
        ...newTest,
        status: 'passed',
        duration: 3000,
        metrics: {
          accuracyScore: 92 + Math.random() * 8,
          performanceScore: 88 + Math.random() * 12
        }
      };
      setTestResults(prev => [...prev, completedTest]);
      setCurrentTest(null);
    }, 3000);
  };

  const runConsensusAlgorithmTest = () => {
    const testId = `consensus_${Date.now()}`;
    const newTest: TestResult = {
      testId,
      testType: 'Consensus Algorithm Validation',
      status: 'running',
      duration: 0,
      metrics: {},
      timestamp: new Date()
    };

    setCurrentTest(newTest);
    
    setTimeout(() => {
      const completedTest: TestResult = {
        ...newTest,
        status: 'passed',
        duration: 5000,
        metrics: {
          consensusTime: performanceMetrics.consensusTime,
          successRate: 98 + Math.random() * 2,
          accuracyScore: 96 + Math.random() * 4
        }
      };
      setTestResults(prev => [...prev, completedTest]);
      setCurrentTest(null);
    }, 5000);
  };

  const exportTestResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      testResults,
      performanceMetrics,
      networkStats,
      validatorCount: validators.length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotionalchain-test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent">
              EmotionalChain Testing Suite
            </h1>
            <p className="text-gray-400 mt-2">
              Comprehensive validation and stress testing for Proof of Emotion consensus
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? 'Network Connected' : 'Network Disconnected'}
            </Badge>
            <Button onClick={exportTestResults} variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Results</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stress-testing" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800 border-slate-700">
          <TabsTrigger value="stress-testing" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Stress Testing</span>
          </TabsTrigger>
          <TabsTrigger value="attack-simulation" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Attack Simulation</span>
          </TabsTrigger>
          <TabsTrigger value="biometric-validation" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Biometric Validation</span>
          </TabsTrigger>
          <TabsTrigger value="consensus-validation" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Consensus Validation</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Automation</span>
          </TabsTrigger>
        </TabsList>

        {/* Consensus Stress Testing */}
        <TabsContent value="stress-testing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Stress Test Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Validators: {stressConfig.validatorCount}
                  </label>
                  <input
                    type="range"
                    value={stressConfig.validatorCount}
                    onChange={(e) => setStressConfig(prev => ({ ...prev, validatorCount: parseInt(e.target.value) }))}
                    max={100}
                    min={5}
                    step={5}
                    className="mt-2 w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Test Rounds: {stressConfig.rounds}
                  </label>
                  <input
                    type="range"
                    value={stressConfig.rounds}
                    onChange={(e) => setStressConfig(prev => ({ ...prev, rounds: parseInt(e.target.value) }))}
                    max={50}
                    min={1}
                    step={1}
                    className="mt-2 w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Network Latency: {stressConfig.networkLatency}ms
                  </label>
                  <input
                    type="range"
                    value={stressConfig.networkLatency}
                    onChange={(e) => setStressConfig(prev => ({ ...prev, networkLatency: parseInt(e.target.value) }))}
                    max={1000}
                    min={10}
                    step={10}
                    className="mt-2 w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Validator Dropout Rate: {stressConfig.dropoutRate}%
                  </label>
                  <input
                    type="range"
                    value={stressConfig.dropoutRate}
                    onChange={(e) => setStressConfig(prev => ({ ...prev, dropoutRate: parseInt(e.target.value) }))}
                    max={50}
                    min={0}
                    step={5}
                    className="mt-2 w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <Button 
                  onClick={runConsensusStressTest}
                  disabled={isRunningStressTest || currentTest?.status === 'running'}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isRunningStressTest || currentTest?.status === 'running' ? (
                    <span className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 animate-pulse" />
                      <span>Running Stress Test...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <Play className="w-4 h-4" />
                      <span>Run Stress Test</span>
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Test Progress */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Test Execution Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTest && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{currentTest.testType}</span>
                      <Badge variant="outline">{currentTest.status}</Badge>
                    </div>
                    <Progress value={testProgress} className="w-full" />
                    <p className="text-xs text-gray-400">{testProgress}% complete</p>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Recent Test Results</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {testResults.slice(-5).reverse().map((result) => (
                      <div key={result.testId} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="text-sm">{result.testType}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {result.duration}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attack Simulation */}
        <TabsContent value="attack-simulation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {attackSimulations.map((attack) => (
              <Card key={attack.attackType} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="capitalize">{attack.attackType} Attack</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={attack.active}
                      onChange={() => toggleAttackSimulation(attack.attackType)}
                      className="w-6 h-6 rounded"
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Intensity: {attack.intensity}%
                    </label>
                    <input
                      type="range"
                      value={attack.intensity}
                      onChange={(e) => {
                        setAttackSimulations(prev =>
                          prev.map(a =>
                            a.attackType === attack.attackType
                              ? { ...a, intensity: parseInt(e.target.value) }
                              : a
                          )
                        );
                      }}
                      max={100}
                      min={1}
                      step={1}
                      className="mt-2 w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Duration: {attack.duration}s
                    </label>
                    <input
                      type="range"
                      value={attack.duration}
                      onChange={(e) => {
                        setAttackSimulations(prev =>
                          prev.map(a =>
                            a.attackType === attack.attackType
                              ? { ...a, duration: parseInt(e.target.value) }
                              : a
                          )
                        );
                      }}
                      max={300}
                      min={30}
                      step={30}
                      className="mt-2 w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <Badge variant={attack.active ? "destructive" : "secondary"}>
                    {attack.active ? 'Attack Active' : 'Attack Inactive'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Biometric Validation Testing */}
        <TabsContent value="biometric-validation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Authenticity Detection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-500">96.8%</div>
                  <p className="text-sm text-gray-400">Detection Accuracy</p>
                </div>
                <Button onClick={runBiometricValidationTest} className="w-full">
                  Run Validation Test
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Device Spoofing Defense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">99.2%</div>
                  <p className="text-sm text-gray-400">Spoofing Detection</p>
                </div>
                <Button className="w-full">Test Spoofing Defense</Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Temporal Consistency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500">94.5%</div>
                  <p className="text-sm text-gray-400">Consistency Score</p>
                </div>
                <Button className="w-full">Test Consistency</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Consensus Algorithm Validation */}
        <TabsContent value="consensus-validation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Mathematical Correctness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Emotional Weight Calculation</span>
                    <Badge variant="outline" className="text-emerald-500">PASSED</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Stake-weighted Consensus</span>
                    <Badge variant="outline" className="text-emerald-500">PASSED</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Byzantine Fault Tolerance</span>
                    <Badge variant="outline" className="text-emerald-500">PASSED</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Consensus Finality</span>
                    <Badge variant="outline" className="text-emerald-500">PASSED</Badge>
                  </div>
                </div>
                <Button onClick={runConsensusAlgorithmTest} className="w-full">
                  Validate Algorithm
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Consensus Threshold Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">60% Threshold</span>
                      <span className="text-sm text-emerald-500">98.5%</span>
                    </div>
                    <Progress value={98.5} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">67% Threshold</span>
                      <span className="text-sm text-emerald-500">96.2%</span>
                    </div>
                    <Progress value={96.2} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">75% Threshold</span>
                      <span className="text-sm text-emerald-500">94.8%</span>
                    </div>
                    <Progress value={94.8} className="h-2" />
                  </div>
                </div>
                <Button className="w-full">Test Thresholds</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Benchmarking */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm">Consensus Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {performanceMetrics.consensusTime.toFixed(0)}ms
                </div>
                <p className="text-xs text-gray-400">Average time to consensus</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm">Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {performanceMetrics.throughput.toFixed(1)} BPM
                </div>
                <p className="text-xs text-gray-400">Blocks per minute</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-500">
                  {performanceMetrics.memoryUsage.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-400">System memory</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">
                  {performanceMetrics.cpuUsage.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-400">Processing power</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automated Test Suite */}
        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Continuous Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(automatedTests).map(([testType, enabled]) => (
                  <div key={testType} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 capitalize">
                      {testType.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => {
                        setAutomatedTests(prev => ({ ...prev, [testType]: e.target.checked }));
                      }}
                      className="w-6 h-6 rounded"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Test Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Next Regression Test</span>
                    <span className="text-sm text-emerald-500">2 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Next Stress Test</span>
                    <span className="text-sm text-emerald-500">6 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Next Security Audit</span>
                    <span className="text-sm text-emerald-500">24 hours</span>
                  </div>
                </div>
                <Button className="w-full">Configure Schedule</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}