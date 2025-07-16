import { useEffect, useRef } from 'react';

interface EmotionalChartProps {
  data: Array<{
    timestamp: string;
    stress: number;
    energy: number;
    focus: number;
  }>;
}

export function EmotionalChart({ data }: EmotionalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    // Dynamically import Chart.js to avoid SSR issues
    import('chart.js/auto').then((Chart) => {
      const ctx = canvasRef.current!.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString());
      
      chartRef.current = new Chart.default(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Network Stress',
              data: data.map(d => d.stress),
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: false,
            },
            {
              label: 'Network Energy',
              data: data.map(d => d.energy),
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.4,
              fill: false,
            },
            {
              label: 'Network Focus',
              data: data.map(d => d.focus),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#9CA3AF',
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: '#6B7280',
              },
              grid: {
                color: '#374151',
              },
            },
            y: {
              ticks: {
                color: '#6B7280',
              },
              grid: {
                color: '#374151',
              },
              min: 0,
              max: 100,
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
        },
      });
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="h-64 w-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
