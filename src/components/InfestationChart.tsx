import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { cn, formatNumber } from '../lib/utils';

interface ChartDataPoint {
  captured_at: string;
  bjp_total: number;
  cjp_total: number;
  bjp_instagram: number;
  cjp_instagram: number;
  bjp_x: number;
  cjp_x: number;
}

interface InfestationChartProps {
  data: ChartDataPoint[];
}

type ViewMode = 'Total' | 'Instagram' | 'X';

export const InfestationChart: React.FC<InfestationChartProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('Instagram');

  const formattedData = useMemo(() => {
    return data.map(d => ({
      ...d,
      timestampForRef: d.captured_at.split('T')[0], // yyyy-mm-dd
      formattedDate: format(new Date(d.captured_at), 'MMM dd, HH:mm')
    }));
  }, [data]);

  const getKeys = () => {
    switch (viewMode) {
      case 'Instagram':
        return { bjp: 'bjp_instagram', cjp: 'cjp_instagram' };
      case 'X':
        return { bjp: 'bjp_x', cjp: 'cjp_x' };
      case 'Total':
      default:
        return { bjp: 'bjp_total', cjp: 'cjp_total' };
    }
  };

  const keys = getKeys();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      
      return (
        <div className="bg-brand-card border-4 border-brand-border p-4 shadow-[4px_4px_0px_0px_#111111]">
          <p className="font-bold text-sm uppercase tracking-wider mb-2 pb-2 border-b-2 border-brand-border">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between gap-6 font-bold text-sm">
                <span style={{ color: entry.color }} className="uppercase">{entry.name}</span>
                <span>{formatNumber(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="brutal-card p-6 bg-brand-card">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-black font-heading uppercase tracking-tighter">Follower Growth Curve</h3>
          <p className="text-sm font-bold text-brand-muted mt-1">Comparing follower growth across platforms.</p>
        </div>
        
        <div className="flex gap-2">
          {(['Instagram', 'Total', 'X'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-4 py-2 border-2 border-brand-border font-bold uppercase text-xs tracking-wider transition-all",
                viewMode === mode 
                  ? "bg-brand-text text-brand-bg shadow-[2px_2px_0px_0px_var(--color-brand-border)]" 
                  : "bg-brand-card hover:bg-grid text-brand-text shadow-[2px_2px_0px_0px_#111111]"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D6D3C7" vertical={false} />
            <XAxis 
              dataKey="formattedDate" 
              stroke="#111111" 
              tick={{ fill: '#78716C', fontSize: 12, fontWeight: 'bold' }}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis 
              stroke="#111111" 
              tick={{ fill: '#78716C', fontSize: 12, fontWeight: 'bold' }}
              tickFormatter={(val) => formatNumber(val)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }} 
            />
            
            <Line 
              type="monotone" 
              name="BJP"
              dataKey={keys.bjp} 
              stroke="#FF7A00" 
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6, fill: "#FF7A00", stroke: "#111", strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              name="CJP"
              dataKey={keys.cjp} 
              stroke="#9CFF00" 
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6, fill: "#9CFF00", stroke: "#111", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
