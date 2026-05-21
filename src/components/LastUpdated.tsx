import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export const LastUpdated: React.FC<{ timestamp: string }> = ({ timestamp }) => {
  if (!timestamp) return null;
  
  return (
    <div className="text-xs font-bold uppercase tracking-widest text-brand-muted">
      Last Scan: {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
    </div>
  );
};
