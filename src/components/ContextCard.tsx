import React from 'react';

export const ContextCard: React.FC = () => {
  return (
    <div className="brutal-card p-6 bg-brand-card">
      <h3 className="text-xl font-black font-heading uppercase tracking-tighter mb-4 border-b-4 border-brand-border pb-2">
        Current Signal
      </h3>
      <ul className="space-y-3 font-body text-sm font-bold">
        <li className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
          <span className="text-brand-muted uppercase tracking-wider min-w-[80px]">Demand</span>
          <span className="text-brand-text">Education Minister resignation over NEET paper leak</span>
        </li>
        <li className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
          <span className="text-brand-muted uppercase tracking-wider min-w-[80px]">Tracking</span>
          <span className="text-brand-text">Public follower growth across Instagram + X</span>
        </li>
        <li className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
          <span className="text-brand-muted uppercase tracking-wider min-w-[80px]">Refresh</span>
          <span className="text-brand-text">Every 1 hour</span>
        </li>
      </ul>
    </div>
  );
};
