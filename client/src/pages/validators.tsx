import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ValidatorWithMetrics {
  address: string;
  stake: number;
  biometricDevice: string;
  isActive: boolean;
  joinedAt: string;
  reputation: number;
  totalBlocks: number;
  missedBlocks: number;
  uptime?: number;
  rewards?: number;
  latestProof?: {
    stressLevel: number;
    energyLevel: number;
    focusLevel: number;
    authenticityScore: number;
    timestamp: string;
  };
}

export default function ValidatorsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage, isConnected } = useWebSocket();
  
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
  const [registrationForm, setRegistrationForm] = useState({
    address: '',
    stake: '',
    biometricDevice: 'Fitbit'
  });

  // Queries
  const { data: validators = [], isLoading: validatorsLoading, refetch: refetchValidators } = useQuery({
    queryKey: ['/api/validators'],
    refetchInterval: 15000,
  });

  const { data: networkStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/network/stats'],
    refetchInterval: 10000,
  });

  // Enhanced validators with metrics and latest proofs
  const [validatorsWithMetrics, setValidatorsWithMetrics] = useState<ValidatorWithMetrics[]>([]);

  useEffect(() => {
    const enhanceValidators = async () => {
      const enhanced = await Promise.all(
        validators.map(async (validator: any) => {
          try {
            const proofResponse = await api.getValidatorProof(validator.address);
            return {
              ...validator,
              uptime: 95 + Math.random() * 5, // Simulated uptime
              rewards: Math.floor(validator.stake * 0.1 * Math.random()), // Simulated rewards
              latestProof: proofResponse
            };
          } catch {
            return {
              ...validator,
              uptime: 95 + Math.random() * 5,
              rewards: Math.floor(validator.stake * 0.1 * Math.random()),
              latestProof: null
            };
          }
        })
      );
      setValidatorsWithMetrics(enhanced);
    };

    if (validators.length > 0) {
      enhanceValidators();
    }
  }, [validators]);

  // Mutations
  const registerValidatorMutation = useMutation({
    mutationFn: api.createValidator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/validators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/network/stats'] });
      setIsRegistrationOpen(false);
      setRegistrationForm({ address: '', stake: '', biometricDevice: 'Fitbit' });
      toast({
        title: "Validator Registered",
        description: "New validator has been successfully registered and is now active.",
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

  // Handle WebSocket updates
  useEffect(() => {
    if (lastMessage?.type === 'validator_update') {
      refetchValidators();
    }
  }, [lastMessage, refetchValidators]);

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationForm.address || !registrationForm.stake) {
      toast({
        title: "Invalid Form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const stake = parseInt(registrationForm.stake);
    if (stake < 10000) {
      toast({
        title: "Insufficient Stake",
        description: "Minimum stake required is 10,000 EMOTION tokens.",
        variant: "destructive",
      });
      return;
    }

    registerValidatorMutation.mutate({
      address: registrationForm.address,
      stake,
      biometricDevice: registrationForm.biometricDevice
    });
  };

  const connectBiometricDevice = async (validatorAddress: string, deviceType: string) => {
    try {
      if (deviceType === 'Fitbit') {
        const { authUrl } = await api.getFitbitAuthUrl(validatorAddress);
        window.open(authUrl, '_blank');
      } else {
        toast({
          title: "Device Not Supported",
          description: `${deviceType} integration coming soon.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to initiate device connection.",
        variant: "destructive",
      });
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Fitbit': return 'fab fa-fitbit';
      case 'Apple Watch': return 'fab fa-apple';
      case 'Samsung Health': return 'fab fa-android';
      case 'Garmin': return 'fas fa-running';
      default: return 'fas fa-heart';
    }
  };

  const getStatusColor = (isActive: boolean, uptime?: number) => {
    if (!isActive) return 'bg-red-500';
    if ((uptime || 0) > 98) return 'bg-emerald-500';
    if ((uptime || 0) > 95) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getPerformanceScore = (validator: ValidatorWithMetrics) => {
    const uptimeScore = (validator.uptime || 0) * 0.4;
    const authScore = (validator.latestProof?.authenticityScore || 0) * 0.3;
    const participationScore = (validator.totalBlocks / Math.max(validator.totalBlocks + validator.missedBlocks, 1)) * 100 * 0.3;
    return Math.round(uptimeScore + authScore + participationScore);
  };

  if (validatorsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-400 mb-4"></i>
          <p className="text-gray-400">Loading validators...</p>
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Emotional Validators
            </h1>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              {validators.length} Active
            </Badge>
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-gray-400">
                {isConnected ? 'Network Connected' : 'Network Disconnected'}
              </span>
            </div>
          </div>
          
          <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <i className="fas fa-user-plus mr-2"></i>
                Register Validator
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-600">
              <DialogHeader>
                <DialogTitle>Register New Validator</DialogTitle>
                <DialogDescription>
                  Register as an emotional validator by staking EMOTION tokens and connecting your biometric device.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegistration} className="space-y-4">
                <div>
                  <Label htmlFor="address">Wallet Address</Label>
                  <Input
                    id="address"
                    value={registrationForm.address}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, address: e.target.value })}
                    placeholder="0x..."
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="stake">Stake Amount (EMOTION)</Label>
                  <Input
                    id="stake"
                    type="number"
                    min="10000"
                    value={registrationForm.stake}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, stake: e.target.value })}
                    placeholder="Minimum 10,000"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="device">Biometric Device</Label>
                  <Select value={registrationForm.biometricDevice} onValueChange={(value) => setRegistrationForm({ ...registrationForm, biometricDevice: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="Fitbit">Fitbit</SelectItem>
                      <SelectItem value="Apple Watch">Apple Watch</SelectItem>
                      <SelectItem value="Samsung Health">Samsung Health</SelectItem>
                      <SelectItem value="Garmin">Garmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  disabled={registerValidatorMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {registerValidatorMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Registering...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Register Validator
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-6">
        {/* Network Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Validators</p>
                  <p className="text-2xl font-bold text-blue-400">{validators.length}</p>
                </div>
                <i className="fas fa-users text-2xl text-blue-400"></i>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Stake</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {((networkStats?.totalStake || 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <i className="fas fa-coins text-2xl text-emerald-400"></i>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Authenticity</p>
                  <p className="text-2xl font-bold text-purple-400">96.8%</p>
                </div>
                <i className="fas fa-shield-alt text-2xl text-purple-400"></i>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Network Health</p>
                  <p className="text-2xl font-bold text-yellow-400">Excellent</p>
                </div>
                <i className="fas fa-heartbeat text-2xl text-yellow-400"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="validators" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-600">
            <TabsTrigger value="validators" className="data-[state=active]:bg-blue-600">
              Active Validators
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600">
              Performance Analytics
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-blue-600">
              Network Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="validators" className="space-y-6">
            {/* Validators Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {validatorsWithMetrics.map((validator) => (
                <Card key={validator.address} className="bg-slate-800 border-slate-600 hover:border-slate-500 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {validator.address.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-sm">
                            {validator.address.length > 16 
                              ? `${validator.address.substring(0, 16)}...` 
                              : validator.address}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {validator.stake.toLocaleString()} EMOTION
                          </CardDescription>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(validator.isActive, validator.uptime)}`}></div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Device Integration */}
                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <i className={`${getDeviceIcon(validator.biometricDevice)} text-blue-400`}></i>
                        <span className="text-sm">{validator.biometricDevice}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => connectBiometricDevice(validator.address, validator.biometricDevice)}
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                      >
                        <i className="fas fa-link mr-1"></i>
                        Connect
                      </Button>
                    </div>

                    {/* Emotional Metrics */}
                    {validator.latestProof ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300">Latest Emotional State</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-red-500/20 rounded border border-red-500/30">
                            <div className="text-red-400 font-mono">{Math.round(validator.latestProof.stressLevel)}%</div>
                            <div className="text-gray-400">Stress</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-500/20 rounded border border-yellow-500/30">
                            <div className="text-yellow-400 font-mono">{Math.round(validator.latestProof.energyLevel)}%</div>
                            <div className="text-gray-400">Energy</div>
                          </div>
                          <div className="text-center p-2 bg-blue-500/20 rounded border border-blue-500/30">
                            <div className="text-blue-400 font-mono">{Math.round(validator.latestProof.focusLevel)}%</div>
                            <div className="text-gray-400">Focus</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Authenticity</span>
                          <span className="text-purple-400 font-mono">
                            {Math.round(validator.latestProof.authenticityScore)}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-slate-700 rounded-lg">
                        <i className="fas fa-exclamation-triangle text-yellow-400 text-lg mb-2"></i>
                        <p className="text-xs text-gray-400">No recent biometric data</p>
                      </div>
                    )}

                    {/* Performance Metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Uptime</span>
                        <span className="text-emerald-400">{(validator.uptime || 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={validator.uptime || 0} className="h-1" />
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Performance Score</span>
                        <span className="text-blue-400">{getPerformanceScore(validator)}/100</span>
                      </div>
                      <Progress value={getPerformanceScore(validator)} className="h-1" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700"
                        onClick={() => setSelectedValidator(validator.address)}
                      >
                        <i className="fas fa-chart-line mr-1"></i>
                        Analytics
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/20"
                      >
                        <i className="fas fa-sync-alt mr-1"></i>
                        Sync
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {validators.length === 0 && (
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-12 text-center">
                  <i className="fas fa-users text-4xl text-gray-600 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No Validators Registered</h3>
                  <p className="text-gray-400 mb-6">
                    Be the first to register as an emotional validator and help secure the network with your biometric data.
                  </p>
                  <Button
                    onClick={() => setIsRegistrationOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    Register as Validator
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-slate-800 border-slate-600">
              <CardHeader>
                <CardTitle>Validator Performance Rankings</CardTitle>
                <CardDescription>
                  Performance based on uptime, authenticity scores, and consensus participation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validatorsWithMetrics
                    .sort((a, b) => getPerformanceScore(b) - getPerformanceScore(a))
                    .map((validator, index) => (
                      <div key={validator.address} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' : 
                            index === 1 ? 'bg-gray-400 text-black' : 
                            index === 2 ? 'bg-orange-400 text-black' : 
                            'bg-slate-600 text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{validator.address}</div>
                            <div className="text-sm text-gray-400">{validator.biometricDevice}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg">{getPerformanceScore(validator)}</div>
                          <div className="text-xs text-gray-400">Performance Score</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-600">
                <CardHeader>
                  <CardTitle>Device Distribution</CardTitle>
                  <CardDescription>Biometric device types across validators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Fitbit', 'Apple Watch', 'Samsung Health', 'Garmin'].map(device => {
                      const count = validators.filter((v: any) => v.biometricDevice === device).length;
                      const percentage = validators.length > 0 ? (count / validators.length) * 100 : 0;
                      return (
                        <div key={device} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center space-x-2">
                              <i className={getDeviceIcon(device)}></i>
                              <span>{device}</span>
                            </span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-600">
                <CardHeader>
                  <CardTitle>Stake Distribution</CardTitle>
                  <CardDescription>EMOTION token distribution among validators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {validatorsWithMetrics
                      .sort((a, b) => b.stake - a.stake)
                      .slice(0, 5)
                      .map(validator => {
                        const percentage = (validator.stake / (networkStats?.totalStake || 1)) * 100;
                        return (
                          <div key={validator.address} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{validator.address.substring(0, 10)}...</span>
                              <span>{validator.stake.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}