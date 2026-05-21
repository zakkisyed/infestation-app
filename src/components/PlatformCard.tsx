import React from 'react';
import { cn, formatNumber } from '../lib/utils';

interface PlatformCardProps {
  platform: 'instagram' | 'x';
  bjpHandle: string;
  cjpHandle: string;
  bjpFollowers: number;
  cjpFollowers: number;
  bjpGrowth: number;
  cjpGrowth: number;
  className?: string;
}

const InstaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
);

export const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  bjpHandle,
  cjpHandle,
  bjpFollowers,
  cjpFollowers,
  bjpGrowth,
  cjpGrowth,
  className
}) => {
  const Icon = platform === 'instagram' ? InstaIcon : XIcon;
  const title = platform === 'instagram' ? 'Instagram' : 'X / Twitter';
  
  const diff = bjpFollowers - cjpFollowers;
  const isCjpAhead = diff < 0;

  return (
    <div className={cn("brutal-card p-6 flex flex-col bg-brand-card", className)}>
      <div className="flex items-center gap-3 mb-6 border-b-4 border-brand-border pb-4">
        <Icon className="w-8 h-8 text-brand-text" strokeWidth={2.5} />
        <h3 className="text-2xl font-black font-heading uppercase tracking-tighter">
          {title}
        </h3>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider mb-2">
            <span className="text-brand-text">@{bjpHandle}</span>
            <span className="text-bjp">BJP</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black font-heading">{formatNumber(bjpFollowers)}</span>
            <span className="text-sm font-bold text-brand-muted">+{formatNumber(bjpGrowth)} since May 19</span>
          </div>
        </div>

        <div className="w-full h-1 bg-brand-border" />

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider mb-2">
            <span className="text-brand-text">@{cjpHandle}</span>
            <span className="text-cjp bg-brand-text px-1">CJP</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black font-heading">{formatNumber(cjpFollowers)}</span>
            <span className="text-sm font-bold text-brand-muted">+{formatNumber(cjpGrowth)} since May 19</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t-2 border-dashed border-brand-border flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">Difference</span>
          <span className={cn(
            "text-lg font-black font-heading uppercase",
            isCjpAhead ? "text-cjp drop-shadow-[1px_1px_0px_#111]" : "text-brand-text"
          )}>
            {formatNumber(Math.abs(diff))} {isCjpAhead ? 'CJP Lead' : 'BJP Lead'}
          </span>
        </div>
      </div>
    </div>
  );
};
