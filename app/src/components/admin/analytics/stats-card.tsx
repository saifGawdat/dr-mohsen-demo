"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {change && (
        <p
          className={`text-xs mt-1 ${
            change.isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {change.isPositive ? "+" : "-"}
          {Math.abs(change.value)}% from previous period
        </p>
      )}
    </div>
  );
};
