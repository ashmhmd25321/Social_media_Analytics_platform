import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  onClick,
}) => {
  const cardClasses = hover ? 'card-hover cursor-pointer' : 'card';
  const classes = onClick ? `${cardClasses} cursor-pointer` : cardClasses;

  return (
    <div
      className={`${classes} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};

export default Card;

