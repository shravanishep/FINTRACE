import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`fin-panel p-4 ${
        hoverable ? 'cursor-pointer hover:border-fin-accent transition-colors' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
