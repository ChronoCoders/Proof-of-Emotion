import { ScrollArea } from './scroll-area';
import { Button } from './button';

interface ActivityLogProps {
  activities: Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
  }>;
  onExport?: () => void;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'consensus':
      return { icon: 'fa-handshake', color: 'text-emerald-400' };
    case 'validator_registration':
      return { icon: 'fa-user-plus', color: 'text-blue-400' };
    case 'emotional_proof':
      return { icon: 'fa-heartbeat', color: 'text-pink-400' };
    case 'fitbit_connected':
      return { icon: 'fa-link', color: 'text-purple-400' };
    case 'stress_test':
      return { icon: 'fa-flask', color: 'text-yellow-400' };
    default:
      return { icon: 'fa-info-circle', color: 'text-gray-400' };
  }
};

export function ActivityLog({ activities, onExport }: ActivityLogProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <i className="fas fa-terminal text-gray-400 mr-2"></i>
          Network Activity Log
        </h3>
        {onExport && (
          <Button
            onClick={onExport}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <i className="fas fa-download mr-1"></i>
            Export
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-64 w-full">
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="space-y-1 text-gray-300 font-mono text-sm">
            {activities.length === 0 ? (
              <p className="text-gray-500">No network activity yet...</p>
            ) : (
              activities.map((activity) => {
                const { icon, color } = getActivityIcon(activity.type);
                const timestamp = new Date(activity.timestamp).toLocaleTimeString();
                
                return (
                  <div key={activity.id} className="fade-in">
                    <span className="text-gray-500">[{timestamp}]</span>{' '}
                    <i className={`fas ${icon} ${color}`}></i>{' '}
                    <span>{activity.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
