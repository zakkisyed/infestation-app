import React from 'react';
import { cn } from '../lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
  accent?: 'cjp' | 'bjp' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  className,
  valueClassName,
  accent = 'neutral'
}) => {
  return (
    <div className={cn("brutal-card p-6 flex flex-col justify-between bg-brand-card", className)}>
      <h3 className="text-sm font-bold uppercase tracking-widest text-brand-muted mb-2">
        {title}
      </h3>
      <div className="flex flex-col items-start mt-auto">
        <span className={cn(
          "text-4xl md:text-5xl font-black font-heading tracking-tighter leading-none mb-1",
          accent === 'cjp' && "text-cjp drop-shadow-[2px_2px_0px_#111111]",
          accent === 'bjp' && "text-bjp drop-shadow-[2px_2px_0px_#111111]",
          valueClassName
        )}>
          {value}
        </span>
        {subtitle && (
          <span className="text-sm font-bold font-body uppercase text-brand-text">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
