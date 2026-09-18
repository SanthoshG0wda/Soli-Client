import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({
  children,
  className = '',
  hoverable = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs ${
        hoverable
          ? 'transition-all duration-150 hover:border-stone-300 hover:shadow-sm'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
