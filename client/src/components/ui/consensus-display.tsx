interface ConsensusDisplayProps {
  consensus: {
    blockHeight: number;
    consensusReached: boolean;
    agreementScore: number;
    participatingValidators: number;
    networkStress: number;
    networkEnergy: number;
    networkFocus: number;
    networkAuthenticity: number;
    timestamp: string;
  } | null;
}

export function ConsensusDisplay({ consensus }: ConsensusDisplayProps) {
  if (!consensus) {
    return (
      <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
        <p className="text-gray-400 text-center">No consensus data available</p>
      </div>
    );
  }

  const statusClass = consensus.consensusReached ? 'from-emerald-500/20 to-blue-500/20 border-emerald-500/30' : 'from-red-500/20 to-orange-500/20 border-red-500/30';
  const statusText = consensus.consensusReached ? '✓ CONSENSUS REACHED' : '❌ CONSENSUS FAILED';
  const statusColor = consensus.consensusReached ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className={`p-4 bg-gradient-to-r ${statusClass} rounded-lg border`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-emerald-400">Block #{consensus.blockHeight}</h4>
        <span className={`px-2 py-1 bg-emerald-500/20 text-xs rounded-full ${statusColor}`}>
          {statusText}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Agreement Score</p>
          <p className={`font-mono ${statusColor}`}>
            {Math.round(consensus.agreementScore)}%
          </p>
        </div>
        <div>
          <p className="text-gray-400">Participants</p>
          <p className="font-mono text-blue-400">
            {consensus.participatingValidators}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Network Stress</p>
          <p className="font-mono text-red-400">
            {Math.round(consensus.networkStress)}%
          </p>
        </div>
        <div>
          <p className="text-gray-400">Timestamp</p>
          <p className="font-mono text-gray-300">
            {new Date(consensus.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Energy</p>
          <p className="font-mono text-yellow-400">
            {Math.round(consensus.networkEnergy)}%
          </p>
        </div>
        <div>
          <p className="text-gray-400">Focus</p>
          <p className="font-mono text-blue-400">
            {Math.round(consensus.networkFocus)}%
          </p>
        </div>
        <div>
          <p className="text-gray-400">Authenticity</p>
          <p className="font-mono text-purple-400">
            {Math.round(consensus.networkAuthenticity)}%
          </p>
        </div>
      </div>
    </div>
  );
}
