import { Card } from "./card";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'red' | 'yellow' | 'blue' | 'green' | 'purple';
}

const colorClasses = {
  red: {
    text: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30'
  },
  yellow: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30'
  },
  blue: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30'
  },
  green: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30'
  },
  purple: {
    text: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30'
  }
};

export function StatCard({ title, value, unit, icon, trend, color = 'blue' }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="gradient-border">
      <div className="gradient-border-content">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <div className="flex items-baseline space-x-1">
              <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
              {unit && <p className="text-xs text-gray-500">{unit}</p>}
            </div>
          </div>
          <div className={`p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center text-xs">
            <i className={`fas ${trend.isPositive ? 'fa-arrow-up' : 'fa-arrow-down'} ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'} mr-1`}></i>
            <span className={trend.isPositive ? 'text-emerald-400' : 'text-red-400'}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last block
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
