import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  period?: string;
  icon?: React.ReactNode;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  change,
  period = "from last period",
  icon,
}) => {
  const renderChangeIndicator = () => {
    if (!change && change !== 0) return null;
    
    if (change > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>{Math.abs(change)}%</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-500">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span>{Math.abs(change)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-400">
          <Minus className="h-4 w-4 mr-1" />
          <span>0%</span>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
          </div>
          {icon && (
            <div className="p-2 bg-purple-900/50 rounded-lg">
              {icon}
            </div>
          )}
        </div>
        {typeof change !== 'undefined' && (
          <div className="mt-4 flex items-center text-sm">
            {renderChangeIndicator()}
            <span className="text-gray-400 ml-1">{period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};