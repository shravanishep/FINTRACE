import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'low' | 'medium' | 'high' | 'critical' | 'status' | 'info' | 'gold';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', className = '' }) => {
  const styles = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
    status: 'bg-blue-50 text-blue-700 border-blue-200',
    info: 'bg-slate-100 text-slate-700 border-slate-200',
    gold: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
