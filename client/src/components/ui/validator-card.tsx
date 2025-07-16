interface ValidatorCardProps {
  validator: {
    address: string;
    stake: number;
    biometricDevice: string;
    isActive: boolean;
  };
  latestProof?: {
    stressLevel: number;
    energyLevel: number;
    focusLevel: number;
    authenticityScore: number;
  };
}

export function ValidatorCard({ validator, latestProof }: ValidatorCardProps) {
  const getInitial = (address: string) => address.charAt(0).toUpperCase();
  const shortAddress = validator.address.length > 20 
    ? validator.address.substring(0, 20) + '...'
    : validator.address;

  const gradientClasses = [
    'from-blue-500 to-purple-500',
    'from-emerald-500 to-cyan-500',
    'from-pink-500 to-orange-500',
    'from-purple-500 to-pink-500',
    'from-yellow-500 to-red-500'
  ];

  const gradientClass = gradientClasses[validator.address.length % gradientClasses.length];

  return (
    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 bg-gradient-to-r ${gradientClass} rounded-full flex items-center justify-center`}>
          <span className="text-xs font-bold">{getInitial(validator.address)}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-200">{shortAddress}</p>
          <p className="text-xs text-gray-400">
            {validator.stake.toLocaleString()} EMOTION
          </p>
          <p className="text-xs text-gray-500">{validator.biometricDevice}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="text-right">
          {latestProof ? (
            <>
              <div className="flex space-x-1 text-xs">
                <span className="text-red-400">S:{Math.round(latestProof.stressLevel)}%</span>
                <span className="text-yellow-400">E:{Math.round(latestProof.energyLevel)}%</span>
                <span className="text-blue-400">F:{Math.round(latestProof.focusLevel)}%</span>
              </div>
              <p className="text-xs text-gray-400">
                Auth: {Math.round(latestProof.authenticityScore)}%
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400">No recent data</p>
          )}
        </div>
        <div className={`w-2 h-2 rounded-full ${validator.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
      </div>
    </div>
  );
}
