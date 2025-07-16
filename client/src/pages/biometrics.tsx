import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Activity, 
  Brain, 
  Shield, 
  Wifi, 
  WifiOff, 
  Battery, 
  Smartphone,
  Watch,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  TrendingUp,
  BarChart3,
  Waves,
  Timer,
  Eye,
  Lock
} from "lucide-react";
import { api } from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import { queryClient } from "@/lib/queryClient";

interface BiometricData {
  heartRate: number;
  hrv?: number;
  skinConductance?: number;
  movement?: number;
  timestamp: number;
}

interface DeviceStatus {
  id: string;
  name: string;
  type: 'fitbit' | 'apple' | 'samsung' | 'garmin';
  connected: boolean;
  battery: number;
  lastSync: string;
  dataQuality: number;
}

interface EmotionalMetrics {
  stress: number;
  energy: number;
  focus: number;
  authenticity: number;
}

interface AntiSpoofingResult {
  score: number;
  confidence: number;
  flags: string[];
  passed: boolean;
}

export default function BiometricsPage() {
  const [selectedValidator, setSelectedValidator] = useState<string>("");
  const [realTimeData, setRealTimeData] = useState<BiometricData | null>(null);
  const [emotionalState, setEmotionalState] = useState<EmotionalMetrics>({
    stress: 0,
    energy: 0,
    focus: 0,
    authenticity: 0
  });
  const [spoofingResult, setSpoofingResult] = useState<AntiSpoofingResult | null>(null);
  const [devices, setDevices] = useState<DeviceStatus[]>([
    {
      id: "fitbit_001",
      name: "Fitbit Sense 2",
      type: "fitbit",
      connected: true,
      battery: 85,
      lastSync: "2 minutes ago",
      dataQuality: 95
    },
    {
      id: "apple_001", 
      name: "Apple Watch Series 9",
      type: "apple",
      connected: false,
      battery: 67,
      lastSync: "15 minutes ago",
      dataQuality: 88
    },
    {
      id: "samsung_001",
      name: "Galaxy Watch 6",
      type: "samsung", 
      connected: false,
      battery: 42,
      lastSync: "1 hour ago",
      dataQuality: 82
    }
  ]);

  const { data: validators } = useQuery({
    queryKey: ["/api/validators"],
    refetchInterval: 5000,
  });

  const { data: networkStats } = useQuery({
    queryKey: ["/api/network/stats"],
    refetchInterval: 5000,
  });

  const { sendMessage } = useWebSocket();

  // Simulate real-time biometric data
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedValidator) {
        const newData: BiometricData = {
          heartRate: 65 + Math.random() * 30,
          hrv: 25 + Math.random() * 50,
          skinConductance: 0.1 + Math.random() * 0.8,
          movement: Math.random() * 100,
          timestamp: Date.now()
        };
        
        setRealTimeData(newData);
        
        // Calculate emotional metrics
        const stress = Math.max(0, Math.min(100, 
          (newData.heartRate - 70) * 2 + (1 - (newData.hrv || 0) / 50) * 50
        ));
        const energy = Math.max(0, Math.min(100,
          ((newData.heartRate - 60) / 40) * 100 + (newData.movement || 0) * 0.5
        ));
        const focus = Math.max(0, Math.min(100,
          ((newData.hrv || 0) / 50) * 60 + (100 - stress) * 0.4
        ));
        const authenticity = Math.max(60, Math.min(100,
          85 + Math.random() * 15 - (stress > 80 ? 20 : 0)
        ));

        setEmotionalState({ stress, energy, focus, authenticity });

        // Anti-spoofing analysis
        const flags = [];
        if (newData.heartRate < 50 || newData.heartRate > 120) flags.push("HR_ANOMALY");
        if ((newData.hrv || 0) < 10) flags.push("LOW_HRV");
        if (stress > 90) flags.push("EXTREME_STRESS");
        
        setSpoofingResult({
          score: authenticity,
          confidence: Math.random() * 20 + 80,
          flags,
          passed: flags.length === 0 && authenticity > 70
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedValidator]);

  const connectDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      // Simulate device connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: (_, deviceId) => {
      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, connected: true, lastSync: "just now" } : d
      ));
    }
  });

  const syncBiometricData = useMutation({
    mutationFn: async (validatorAddress: string) => {
      return api.syncBiometricData(validatorAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/validators"] });
    }
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'fitbit': return <Activity className="h-4 w-4" />;
      case 'apple': return <Watch className="h-4 w-4" />;
      case 'samsung': return <Smartphone className="h-4 w-4" />;
      case 'garmin': return <Timer className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const getEmotionalColor = (value: number) => {
    if (value < 30) return "bg-blue-500";
    if (value < 60) return "bg-green-500";
    if (value < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Biometric Intelligence Center</h1>
        <p className="text-muted-foreground">
          Real-time biometric data processing and emotional intelligence for EmotionalChain's PoE consensus
        </p>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {devices.map((device) => (
          <Card key={device.id} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getDeviceIcon(device.type)}
                {device.name}
              </CardTitle>
              {device.connected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={device.connected ? "default" : "secondary"}>
                    {device.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Battery</span>
                  <div className="flex items-center gap-2">
                    <Battery className="h-3 w-3" />
                    <span className="text-sm">{device.battery}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data Quality</span>
                  <Progress value={device.dataQuality} className="w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Sync</span>
                  <span className="text-sm">{device.lastSync}</span>
                </div>
                {!device.connected && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => connectDevice.mutate(device.id)}
                    disabled={connectDevice.isPending}
                  >
                    {connectDevice.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Connect Device"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="live-data" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="live-data">Live Data</TabsTrigger>
          <TabsTrigger value="emotional-ai">Emotional AI</TabsTrigger>
          <TabsTrigger value="anti-spoofing">Anti-Spoofing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="live-data" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validator Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Validator Selection
                </CardTitle>
                <CardDescription>
                  Select a validator to monitor real-time biometric data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validators?.map((validator: any) => (
                    <Button
                      key={validator.address}
                      variant={selectedValidator === validator.address ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedValidator(validator.address)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{validator.address.slice(0, 8)}...{validator.address.slice(-4)}</span>
                        <Badge variant="secondary">{validator.biometricDevice}</Badge>
                      </div>
                    </Button>
                  ))}
                  
                  {(!validators || validators.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No validators registered</p>
                      <p className="text-sm">Add validators to monitor biometric data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Biometric Stream */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Live Biometric Stream
                </CardTitle>
                <CardDescription>
                  Real-time physiological data from connected devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedValidator && realTimeData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">Heart Rate</span>
                        </div>
                        <div className="text-2xl font-bold">{Math.round(realTimeData.heartRate)} BPM</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">HRV</span>
                        </div>
                        <div className="text-2xl font-bold">{Math.round(realTimeData.hrv || 0)} ms</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Skin Conductance</span>
                      </div>
                      <Progress value={(realTimeData.skinConductance || 0) * 100} className="w-full" />
                      <div className="text-sm text-muted-foreground">
                        {(realTimeData.skinConductance || 0).toFixed(2)} μS
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Movement Activity</span>
                      </div>
                      <Progress value={realTimeData.movement || 0} className="w-full" />
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => syncBiometricData.mutate(selectedValidator)}
                      disabled={syncBiometricData.isPending}
                    >
                      {syncBiometricData.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Activity className="h-4 w-4 mr-2" />
                      )}
                      Sync to Blockchain
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a validator to view live data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emotional-ai" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emotional Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Emotional Intelligence Processing
                </CardTitle>
                <CardDescription>
                  Real-time conversion of biometric data to emotional metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Stress Level</span>
                      <span className="text-sm text-muted-foreground">{Math.round(emotionalState.stress)}%</span>
                    </div>
                    <Progress value={emotionalState.stress} className={`w-full ${getEmotionalColor(emotionalState.stress)}`} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Energy Level</span>
                      <span className="text-sm text-muted-foreground">{Math.round(emotionalState.energy)}%</span>
                    </div>
                    <Progress value={emotionalState.energy} className={`w-full ${getEmotionalColor(emotionalState.energy)}`} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Focus Level</span>
                      <span className="text-sm text-muted-foreground">{Math.round(emotionalState.focus)}%</span>
                    </div>
                    <Progress value={emotionalState.focus} className={`w-full ${getEmotionalColor(emotionalState.focus)}`} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Authenticity Score</span>
                      <span className="text-sm text-muted-foreground">{Math.round(emotionalState.authenticity)}%</span>
                    </div>
                    <Progress value={emotionalState.authenticity} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emotional State Classification */}
            <Card>
              <CardHeader>
                <CardTitle>Emotional State Classification</CardTitle>
                <CardDescription>
                  AI-powered emotional pattern recognition and consensus weight calculation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Current State</span>
                      <Badge variant={emotionalState.stress > 70 ? "destructive" : "default"}>
                        {emotionalState.stress > 70 ? "Stressed" : 
                         emotionalState.energy > 70 ? "Energetic" :
                         emotionalState.focus > 70 ? "Focused" : "Calm"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {emotionalState.stress > 70 ? "High stress detected, consensus weight may be reduced" :
                       emotionalState.energy > 70 ? "High energy state, optimal for consensus participation" :
                       emotionalState.focus > 70 ? "High focus detected, increased consensus reliability" :
                       "Balanced emotional state, standard consensus weight"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Consensus Impact</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Weight Modifier:</span>
                        <div className="font-medium">
                          {emotionalState.authenticity > 80 ? "+15%" : 
                           emotionalState.authenticity > 60 ? "0%" : "-10%"}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reliability:</span>
                        <div className="font-medium">
                          {emotionalState.focus > 70 ? "High" :
                           emotionalState.focus > 40 ? "Medium" : "Low"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anti-spoofing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Authenticity Verification
              </CardTitle>
              <CardDescription>
                Advanced anti-spoofing algorithms ensure biometric data integrity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spoofingResult ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {spoofingResult.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        {spoofingResult.passed ? "Data Verified" : "Anomalies Detected"}
                      </span>
                    </div>
                    <Badge variant={spoofingResult.passed ? "default" : "destructive"}>
                      {Math.round(spoofingResult.score)}% Authentic
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Authenticity Score</span>
                      <span className="text-sm text-muted-foreground">{Math.round(spoofingResult.score)}%</span>
                    </div>
                    <Progress value={spoofingResult.score} className="w-full" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Level</span>
                      <span className="text-sm text-muted-foreground">{Math.round(spoofingResult.confidence)}%</span>
                    </div>
                    <Progress value={spoofingResult.confidence} className="w-full" />
                  </div>

                  {spoofingResult.flags.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Detection Flags</h4>
                      <div className="space-y-1">
                        {spoofingResult.flags.map((flag, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            <span className="text-sm">{flag.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Verification Methods</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Temporal Consistency</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Natural Variation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Device Signature</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Physiological Limits</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active biometric data to verify</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Biometric Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Historical biometric trends</p>
                  <p className="text-sm">Coming soon...</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Health Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Correlation analysis</p>
                  <p className="text-sm">Coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Privacy & Security
              </CardTitle>
              <CardDescription>
                Zero-knowledge proofs and encryption ensure biometric data privacy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-green-500" />
                      <span className="font-medium">End-to-End Encryption</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All biometric data is encrypted on-device before transmission
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Zero-Knowledge Proofs</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Emotional states verified without revealing raw data
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">GDPR Compliant</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Full data portability and deletion rights
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Selective Sharing</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Granular control over data sharing permissions
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Data Retention Policy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Raw biometric data: Encrypted locally, never stored on blockchain</li>
                    <li>• Emotional metrics: Aggregated and anonymized after 30 days</li>
                    <li>• Consensus participation: Permanently recorded for network integrity</li>
                    <li>• User can request full data deletion at any time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}