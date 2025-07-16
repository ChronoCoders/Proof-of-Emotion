import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Brain, 
  Target, 
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity
} from 'lucide-react';

// Analytics Tab Component for EmotionalChain
export default function Analytics() {
  const [activeTab, setActiveTab] = useState('network');
  const [networkData, setNetworkData] = useState({
    emotionalIntelligence: {
      networkStress: 32,
      networkEnergy: 78,
      networkFocus: 65,
      emotionalVolatility: 15,
      consensusStability: 92
    },
    trends: [
      { time: '00:00', stress: 28, energy: 82, focus: 70, consensus: 94 },
      { time: '04:00', stress: 22, energy: 85, focus: 75, consensus: 96 },
      { time: '08:00', stress: 45, energy: 70, focus: 60, consensus: 88 },
      { time: '12:00', stress: 52, energy: 65, focus: 55, consensus: 85 },
      { time: '16:00', stress: 38, energy: 75, focus: 68, consensus: 90 },
      { time: '20:00', stress: 32, energy: 78, focus: 65, consensus: 92 }
    ]
  });

  const [validatorAnalytics, setValidatorAnalytics] = useState({
    performanceDistribution: [
      { category: 'High Performers', count: 12, percentage: 35 },
      { category: 'Stable Contributors', count: 18, percentage: 53 },
      { category: 'Inconsistent', count: 4, percentage: 12 }
    ],
    emotionalConsistency: [
      { validator: 'Validator_001', consistency: 94, rewards: 1250 },
      { validator: 'Validator_002', consistency: 91, rewards: 1180 },
      { validator: 'Validator_003', consistency: 89, rewards: 1120 },
      { validator: 'Validator_004', consistency: 86, rewards: 1050 },
      { validator: 'Validator_005', consistency: 83, rewards: 980 }
    ]
  });

  const [economicMetrics, setEconomicMetrics] = useState({
    tokenDistribution: [
      { category: 'Validator Rewards', value: 450000, percentage: 45 },
      { category: 'Staking Pool', value: 300000, percentage: 30 },
      { category: 'Development Fund', value: 150000, percentage: 15 },
      { category: 'Community Grants', value: 100000, percentage: 10 }
    ],
    rewardTrends: [
      { period: 'Week 1', totalRewards: 8500, avgReward: 250 },
      { period: 'Week 2', totalRewards: 9200, avgReward: 271 },
      { period: 'Week 3', totalRewards: 8800, avgReward: 259 },
      { period: 'Week 4', totalRewards: 9500, avgReward: 279 }
    ]
  });

  const [predictiveAnalytics, setPredictiveAnalytics] = useState({
    consensusProjection: [
      { period: 'Current', rate: 92, confidence: 100 },
      { period: '+1 Week', rate: 94, confidence: 85 },
      { period: '+2 Weeks', rate: 95, confidence: 78 },
      { period: '+1 Month', rate: 96, confidence: 65 },
      { period: '+3 Months', rate: 97, confidence: 45 }
    ],
    networkGrowth: {
      currentValidators: 34,
      projectedValidators: 67,
      growthRate: 15.2,
      confidenceLevel: 82
    }
  });

  const COLORS = ['#00ff00', '#00ffff', '#ffff00', '#ff6b6b', '#4ecdc4'];

  const NetworkIntelligence = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-green-500">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Network Emotional Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Network Stress</span>
              <span className="text-red-400 font-bold">{networkData.emotionalIntelligence.networkStress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${networkData.emotionalIntelligence.networkStress}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Network Energy</span>
              <span className="text-yellow-400 font-bold">{networkData.emotionalIntelligence.networkEnergy}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${networkData.emotionalIntelligence.networkEnergy}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Network Focus</span>
              <span className="text-blue-400 font-bold">{networkData.emotionalIntelligence.networkFocus}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${networkData.emotionalIntelligence.networkFocus}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-cyan-500">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Consensus Stability
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">
              {networkData.emotionalIntelligence.consensusStability}%
            </div>
            <div className="text-gray-400 text-sm">Average Success Rate</div>
            <div className="mt-4 text-green-400 text-sm">
              ↑ +2.3% from last week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Emotional Volatility
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {networkData.emotionalIntelligence.emotionalVolatility}%
            </div>
            <div className="text-gray-400 text-sm">Volatility Index</div>
            <div className="mt-4 text-green-400 text-sm">
              ↓ -1.8% (Improving)
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-green-500">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center">
            <LineChartIcon className="w-5 h-5 mr-2" />
            24-Hour Emotional Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={networkData.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #10B981',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="stress" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="energy" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="focus" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="consensus" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ValidatorAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-green-500">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2" />
              Validator Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={validatorAnalytics.performanceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {validatorAnalytics.performanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {validatorAnalytics.performanceDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-gray-300 text-sm">{item.category}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-cyan-500">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Top Validator Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validatorAnalytics.emotionalConsistency.map((validator, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-black font-bold text-sm mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-gray-300 font-medium">{validator.validator}</div>
                      <div className="text-gray-500 text-sm">Consistency: {validator.consistency}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">{validator.rewards}</div>
                    <div className="text-gray-500 text-sm">EMOTION</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-yellow-500">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Validator Behavior Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={validatorAnalytics.emotionalConsistency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="validator" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #F59E0B',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="consistency" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const EconomicInsights = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-green-500">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Token Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={economicMetrics.tokenDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {economicMetrics.tokenDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {economicMetrics.tokenDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-gray-300 text-sm">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">{item.value.toLocaleString()}</div>
                    <div className="text-gray-500 text-xs">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-cyan-500">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Reward Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={economicMetrics.rewardTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="period" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #06B6D4',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalRewards" 
                    stroke="#06B6D4" 
                    fill="#06B6D4" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-purple-500">
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Economic Health Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">1.2M</div>
              <div className="text-gray-400 text-sm">Total Staked EMOTION</div>
              <div className="text-green-400 text-xs mt-1">↑ +8.5% this month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-2">$2.45</div>
              <div className="text-gray-400 text-sm">Average Token Value</div>
              <div className="text-yellow-400 text-xs mt-1">↑ +12.3% this week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">34.2%</div>
              <div className="text-gray-400 text-sm">Network Utilization</div>
              <div className="text-blue-400 text-xs mt-1">↑ +5.1% trending up</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PredictiveAnalytics = () => (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Consensus Success Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictiveAnalytics.consensusProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="period" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #3B82F6',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={3} />
                <Line type="monotone" dataKey="confidence" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-green-500">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Network Growth Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Validators</span>
                <span className="text-green-400 font-bold">{predictiveAnalytics.networkGrowth.currentValidators}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Projected (3 months)</span>
                <span className="text-yellow-400 font-bold">{predictiveAnalytics.networkGrowth.projectedValidators}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Growth Rate</span>
                <span className="text-blue-400 font-bold">{predictiveAnalytics.networkGrowth.growthRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Confidence Level</span>
                <span className="text-cyan-400 font-bold">{predictiveAnalytics.networkGrowth.confidenceLevel}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-purple-500">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              AI Predictions Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-green-400 font-semibold mb-1">Network Health</div>
                <div className="text-gray-300 text-sm">Emotional stability improving by 8.5% monthly</div>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-yellow-400 font-semibold mb-1">Validator Adoption</div>
                <div className="text-gray-300 text-sm">97% probability of reaching 60+ validators</div>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-blue-400 font-semibold mb-1">Consensus Efficiency</div>
                <div className="text-gray-300 text-sm">Expected 97% success rate by Q2</div>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-cyan-400 font-semibold mb-1">Economic Growth</div>
                <div className="text-gray-300 text-sm">Token value correlation: +0.84 with network health</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const exportData = () => {
    const analyticsData = {
      networkIntelligence: networkData,
      validatorAnalytics,
      economicMetrics,
      predictiveAnalytics,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `emotional-chain-analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-2">EmotionalChain Analytics</h1>
          <p className="text-gray-400">Deep business intelligence for the world's first emotion-driven blockchain</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            onClick={() => setActiveTab('network')}
            variant={activeTab === 'network' ? 'default' : 'outline'}
            className={activeTab === 'network' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500 text-green-400 hover:bg-green-600'}
          >
            <Brain className="w-4 h-4 mr-2" />
            Network Intelligence
          </Button>
          <Button
            onClick={() => setActiveTab('validators')}
            variant={activeTab === 'validators' ? 'default' : 'outline'}
            className={activeTab === 'validators' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-500 text-cyan-400 hover:bg-cyan-600'}
          >
            <Users className="w-4 h-4 mr-2" />
            Validator Analytics
          </Button>
          <Button
            onClick={() => setActiveTab('economics')}
            variant={activeTab === 'economics' ? 'default' : 'outline'}
            className={activeTab === 'economics' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-yellow-500 text-yellow-400 hover:bg-yellow-600'}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Economic Insights
          </Button>
          <Button
            onClick={() => setActiveTab('predictive')}
            variant={activeTab === 'predictive' ? 'default' : 'outline'}
            className={activeTab === 'predictive' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500 text-blue-400 hover:bg-blue-600'}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Predictive Analytics
          </Button>
          <Button
            onClick={exportData}
            variant="outline"
            className="border-purple-500 text-purple-400 hover:bg-purple-600 ml-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>

        <div className="mb-8">
          {activeTab === 'network' && <NetworkIntelligence />}
          {activeTab === 'validators' && <ValidatorAnalytics />}
          {activeTab === 'economics' && <EconomicInsights />}
          {activeTab === 'predictive' && <PredictiveAnalytics />}
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4">Research & Academic Export</h3>
          <p className="text-gray-300 mb-4">
            EmotionalChain provides anonymized emotional consensus data for academic research and social impact studies.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-600">
              Generate Research Dataset
            </Button>
            <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-600">
              API Documentation
            </Button>
            <Button variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-600">
              Privacy Guidelines
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}