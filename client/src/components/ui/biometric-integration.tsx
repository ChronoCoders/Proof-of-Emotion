import { useState } from 'react';
import { Button } from './button';

interface BiometricIntegrationProps {
  isConnected: boolean;
  onConnect: () => void;
  onSync: () => void;
  currentData?: {
    heartRate: number;
    hrv?: number;
    activityLevel: string;
  };
  isLoading?: boolean;
}

export function BiometricIntegration({ 
  isConnected, 
  onConnect, 
  onSync, 
  currentData,
  isLoading = false 
}: BiometricIntegrationProps) {
  return (
    <div className="space-y-4">
      {isConnected ? (
        <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-400">Fitbit Connected</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs text-gray-400">Last sync: 2 minutes ago</p>
        </div>
      ) : (
        <div className="p-3 bg-gray-500/20 rounded-lg border border-gray-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Fitbit Disconnected</span>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          <p className="text-xs text-gray-400">Connect to access real biometric data</p>
        </div>
      )}

      {currentData && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Heart Rate</span>
            <span className="text-sm font-mono text-pink-400">
              {currentData.heartRate} BPM
            </span>
          </div>
          {currentData.hrv && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">HRV</span>
              <span className="text-sm font-mono text-purple-400">
                {Math.round(currentData.hrv)}ms
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Activity Level</span>
            <span className="text-sm font-mono text-yellow-400">
              {currentData.activityLevel}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {!isConnected ? (
          <Button 
            onClick={onConnect}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <i className="fab fa-fitbit mr-2"></i>
            Connect Fitbit
          </Button>
        ) : (
          <Button 
            onClick={onSync}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'} mr-2`}></i>
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
      </div>
    </div>
  );
}
