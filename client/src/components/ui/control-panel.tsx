import { Button } from './button';

interface ControlPanelProps {
  onInitialize: () => void;
  onRegisterValidators: () => void;
  onSimulateData: () => void;
  onRunConsensus: () => void;
  onStressTest: () => void;
  onClearLogs: () => void;
  isLoading?: {
    initialize?: boolean;
    validators?: boolean;
    simulate?: boolean;
    consensus?: boolean;
    stressTest?: boolean;
  };
}

export function ControlPanel({
  onInitialize,
  onRegisterValidators,
  onSimulateData,
  onRunConsensus,
  onStressTest,
  onClearLogs,
  isLoading = {}
}: ControlPanelProps) {
  const buttons = [
    {
      label: 'Initialize',
      icon: 'fa-power-off',
      color: 'emerald',
      onClick: onInitialize,
      loading: isLoading.initialize,
    },
    {
      label: 'Add Validators',
      icon: 'fa-user-plus',
      color: 'blue',
      onClick: onRegisterValidators,
      loading: isLoading.validators,
    },
    {
      label: 'Biometric Data',
      icon: 'fa-heartbeat',
      color: 'pink',
      onClick: onSimulateData,
      loading: isLoading.simulate,
    },
    {
      label: 'Run Consensus',
      icon: 'fa-handshake',
      color: 'emerald',
      onClick: onRunConsensus,
      loading: isLoading.consensus,
    },
    {
      label: 'Stress Test',
      icon: 'fa-flask',
      color: 'yellow',
      onClick: onStressTest,
      loading: isLoading.stressTest,
    },
    {
      label: 'Clear Logs',
      icon: 'fa-trash',
      color: 'red',
      onClick: onClearLogs,
      loading: false,
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'text-emerald-400 hover:border-emerald-500';
      case 'blue':
        return 'text-blue-400 hover:border-blue-500';
      case 'pink':
        return 'text-pink-400 hover:border-pink-500';
      case 'yellow':
        return 'text-yellow-400 hover:border-yellow-500';
      case 'red':
        return 'text-red-400 hover:border-red-500';
      default:
        return 'text-gray-400 hover:border-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {buttons.map((button) => (
        <button
          key={button.label}
          onClick={button.onClick}
          disabled={button.loading}
          className={`flex flex-col items-center justify-center p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-500 ${getColorClasses(button.color)} ${
            button.loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <i className={`fas ${button.loading ? 'fa-spinner fa-spin' : button.icon} ${getColorClasses(button.color).split(' ')[0]} text-xl mb-2`}></i>
          <span className="text-xs">{button.label}</span>
        </button>
      ))}
    </div>
  );
}
