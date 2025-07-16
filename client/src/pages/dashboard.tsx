import { useState, useEffect } from 'react';
import { usePoENetwork } from '@/hooks/use-poe-network';
import { StatCard } from '@/components/ui/stat-card';
import { ValidatorCard } from '@/components/ui/validator-card';
import { ConsensusDisplay } from '@/components/ui/consensus-display';
import { BiometricIntegration } from '@/components/ui/biometric-integration';
import { ActivityLog } from '@/components/ui/activity-log';
import { EmotionalChart } from '@/components/ui/emotional-chart';
import { ControlPanel } from '@/components/ui/control-panel';

export default function Dashboard() {
  const {
    validators,
    networkStats,
    consensusBlocks,
    networkActivity,
    isConnected,
    validatorsLoading,
    statsLoading,
    consensusLoading,
    activityLoading,
    createValidator,
    runConsensus,
    syncBiometric,
    runStressTest,
    isCreatingValidator,
    isRunningConsensus,
    isSyncingBiometric,
    isRunningStressTest,
    initializeNetwork,
    simulateRealData,
    connectFitbit,
  } = usePoENetwork();

  const [chartData, setChartData] = useState<Array<{
    timestamp: string;
    stress: number;
    energy: number;
    focus: number;
  }>>([]);

  // Update chart data when consensus blocks change
  useEffect(() => {
    if (consensusBlocks.length > 0) {
      const newChartData = consensusBlocks
        .slice(-10) // Last 10 blocks
        .reverse()
        .map(block => ({
          timestamp: block.timestamp,
          stress: block.networkStress,
          energy: block.networkEnergy,
          focus: block.networkFocus,
        }));
      setChartData(newChartData);
    }
  }, [consensusBlocks]);

  const latestConsensus = consensusBlocks[0] || null;

  const handleClearLogs = () => {
    // This would typically clear the logs on the backend
    console.log('Clearing logs...');
  };

  const handleExportLogs = () => {
    const logData = networkActivity.map(activity => 
      `[${new Date(activity.timestamp).toLocaleString()}] ${activity.type}: ${activity.message}`
    ).join('\n');
    
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poe-network-logs.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 font-sans">
      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-brain text-pink-500 text-2xl"></i>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent">
                EmotionalChain Console
              </h1>
            </div>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
              PoE v1.0.0
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => connectFitbit('validator_alice')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fab fa-fitbit"></i>
              <span>Connect Fitbit</span>
            </button>
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-gray-400">
                {isConnected ? 'Network Active' : 'Network Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 border-r border-slate-700 p-4">
          <nav className="space-y-2">
            <a href="/" className="flex items-center space-x-3 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </a>
            <a href="/validators" className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-slate-700 rounded-lg transition-colors">
              <i className="fas fa-users"></i>
              <span>Validators</span>
            </a>
            <a href="#consensus" className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-slate-700 rounded-lg transition-colors">
              <i className="fas fa-handshake"></i>
              <span>Consensus</span>
            </a>
            <a href="#biometrics" className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-slate-700 rounded-lg transition-colors">
              <i className="fas fa-heartbeat"></i>
              <span>Biometrics</span>
            </a>
            <a href="#testing" className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-slate-700 rounded-lg transition-colors">
              <i className="fas fa-flask"></i>
              <span>Testing Suite</span>
            </a>
            <a href="#analytics" className="flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-slate-700 rounded-lg transition-colors">
              <i className="fas fa-chart-line"></i>
              <span>Analytics</span>
            </a>
          </nav>

          {/* Network Status */}
          <div className="mt-8 p-4 bg-slate-700 rounded-lg border border-slate-600">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Network Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Consensus Rate</span>
                <span className="text-xs font-mono text-emerald-400">
                  {statsLoading ? '...' : `${(networkStats?.recentConsensusRate || 0).toFixed(1)}%`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Active Validators</span>
                <span className="text-xs font-mono text-blue-400">
                  {validatorsLoading ? '...' : validators.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Avg Authenticity</span>
                <span className="text-xs font-mono text-purple-400">
                  {statsLoading ? '...' : '96.8%'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Header Stats */}
          <div className="p-6 border-b border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Network Stress"
                value={statsLoading ? '...' : `${(networkStats?.averageNetworkStress || 0).toFixed(0)}`}
                unit="%"
                icon={<i className="fas fa-exclamation-triangle text-red-400"></i>}
                color="red"
                trend={{ value: -5.2, isPositive: true }}
              />
              <StatCard
                title="Network Energy"
                value={statsLoading ? '...' : `${(networkStats?.averageNetworkEnergy || 0).toFixed(0)}`}
                unit="%"
                icon={<i className="fas fa-bolt text-yellow-400"></i>}
                color="yellow"
                trend={{ value: 2.1, isPositive: true }}
              />
              <StatCard
                title="Network Focus"
                value={statsLoading ? '...' : `${(networkStats?.averageNetworkFocus || 0).toFixed(0)}`}
                unit="%"
                icon={<i className="fas fa-eye text-blue-400"></i>}
                color="blue"
                trend={{ value: 7.3, isPositive: true }}
              />
              <StatCard
                title="Total Stake"
                value={statsLoading ? '...' : `${((networkStats?.totalStake || 0) / 1000000).toFixed(1)}M`}
                unit="EMOTION"
                icon={<i className="fas fa-coins text-emerald-400"></i>}
                color="green"
                trend={{ value: 12.5, isPositive: true }}
              />
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6 space-y-6">
            {/* Control Panel */}
            <div className="bg-slate-800 rounded-xl border border-slate-600 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-cogs text-blue-400 mr-2"></i>
                Network Control Panel
              </h2>
              <ControlPanel
                onInitialize={initializeNetwork}
                onRegisterValidators={initializeNetwork}
                onSimulateData={simulateRealData}
                onRunConsensus={runConsensus}
                onStressTest={() => runStressTest({ rounds: 10, validatorCount: 5 })}
                onClearLogs={handleClearLogs}
                isLoading={{
                  validators: isCreatingValidator,
                  consensus: isRunningConsensus,
                  stressTest: isRunningStressTest,
                }}
              />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real-time Emotional State Chart */}
              <div className="bg-slate-800 rounded-xl border border-slate-600 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <i className="fas fa-chart-line text-pink-400 mr-2"></i>
                  Network Emotional State
                </h3>
                <EmotionalChart data={chartData} />
              </div>

              {/* Active Validators */}
              <div className="bg-slate-800 rounded-xl border border-slate-600 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <i className="fas fa-users text-blue-400 mr-2"></i>
                  Active Validators
                  <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    {validators.length} Active
                  </span>
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {validatorsLoading ? (
                    <div className="text-center text-gray-400">Loading validators...</div>
                  ) : validators.length === 0 ? (
                    <div className="text-center text-gray-400">No validators registered yet</div>
                  ) : (
                    validators.map((validator) => (
                      <ValidatorCard
                        key={validator.address}
                        validator={validator}
                        latestProof={undefined} // Would need to fetch latest proofs
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Consensus History and Biometric Integration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Consensus */}
              <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-600 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <i className="fas fa-handshake text-emerald-400 mr-2"></i>
                  Latest Consensus Results
                </h3>
                {consensusLoading ? (
                  <div className="text-center text-gray-400">Loading consensus data...</div>
                ) : (
                  <ConsensusDisplay consensus={latestConsensus} />
                )}
              </div>

              {/* Fitbit Integration */}
              <div className="bg-slate-800 rounded-xl border border-slate-600 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <i className="fab fa-fitbit text-blue-400 mr-2"></i>
                  Biometric Integration
                </h3>
                <BiometricIntegration
                  isConnected={false} // Would need to check validator connection status
                  onConnect={() => connectFitbit('validator_alice')}
                  onSync={() => syncBiometric('validator_alice')}
                  isLoading={isSyncingBiometric}
                  currentData={{
                    heartRate: 72,
                    hrv: 45,
                    activityLevel: 'Moderate'
                  }}
                />
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-slate-800 rounded-xl border border-slate-600 p-6">
              <ActivityLog
                activities={networkActivity}
                onExport={handleExportLogs}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
