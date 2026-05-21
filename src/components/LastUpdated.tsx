import React from 'react';
import { safeFormatDistance } from '../lib/utils';

export const LastUpdated: React.FC<{ timestamp: string }> = ({ timestamp }) => {
  if (!timestamp) return null;

  return (
    <div className="text-xs font-bold uppercase tracking-widest text-brand-muted">
      Last Scan: {safeFormatDistance(timestamp)}
    </div>
  );
};
