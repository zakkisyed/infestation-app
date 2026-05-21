import React from 'react';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'alert' | 'success';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  children, 
  variant = 'default',
  className 
}) => {
  return (
    <span className={cn(
      "brutal-badge",
      variant === 'alert' && "bg-stamp text-white border-stamp shadow-[2px_2px_0px_0px_#111111]",
      variant === 'success' && "bg-cjp text-brand-text border-brand-border",
      className
    )}>
      {children}
    </span>
  );
};
