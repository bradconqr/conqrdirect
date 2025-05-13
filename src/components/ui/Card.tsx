import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'ghost';
  isHoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  variant = 'default',
  isHoverable = false,
  ...props
}) => {
  const variants = {
    default: "bg-gray-900 shadow-sm border border-gray-800",
    outline: "border border-gray-200 bg-transparent",
    ghost: "bg-transparent", 
  };

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        variants[variant],
        isHoverable && "transition-all duration-200 hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn("px-6 py-5 border-b border-gray-800", className)}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle: React.FC<CardTitleProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn("text-lg font-semibold text-gray-100", className)}
      {...props}
    >
      {children}
    </h3>
  );
};

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={cn("text-sm text-gray-400 mt-1", className)}
      {...props}
    >
      {children}
    </p>
  );
};

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn("px-6 py-5", className)}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn("px-6 py-4 bg-gray-800 border-t border-gray-700", className)}
      {...props}
    >
      {children}
    </div>
  );
};