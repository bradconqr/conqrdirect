import React from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  as: Component = 'button',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:pointer-events-none touch-manipulation";
  
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus-visible:ring-indigo-500 active:from-indigo-800 active:to-purple-800",
    secondary: "bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-500 active:bg-teal-800",
    outline: "border border-gray-700 bg-transparent hover:bg-gray-800 focus-visible:ring-gray-600 active:bg-gray-700 text-gray-300",
    ghost: "bg-transparent hover:bg-gray-800 focus-visible:ring-gray-600 active:bg-gray-700 text-gray-300",
    link: "bg-transparent underline-offset-4 hover:underline text-purple-700 hover:text-purple-800 p-0 focus-visible:ring-purple-500 active:text-purple-900",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 active:bg-red-800",
  };
  
  const sizes = {
    sm: "text-xs px-2 sm:px-3 py-1 sm:py-1.5 h-8 sm:h-8",
    md: "text-sm px-3 sm:px-4 py-1.5 sm:py-2 h-9 sm:h-10",
    lg: "text-base px-4 sm:px-5 py-2 sm:py-2.5 h-10 sm:h-12",
    xl: "text-lg px-5 sm:px-6 py-2.5 sm:py-3 h-12 sm:h-14",
  };

  return (
    <Component
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
        "touch-manipulation" // Improve touch response
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </Component>
  );
};