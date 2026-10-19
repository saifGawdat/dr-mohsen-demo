"use client";

import * as React from "react";
import { Calendar } from "lucide-react";

interface PeriodFilterProps {
  value: string;
  onChange: (period: string, range?: { start: string; end: string }) => void;
}

const periods = [
  { value: "day", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last Year" },
  { value: "custom", label: "Custom" },
];

export const PeriodFilter: React.FC<PeriodFilterProps> = ({ value, onChange }) => {
  const [showCustom, setShowCustom] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const handlePeriodClick = (period: string) => {
    if (period === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(period);
    }
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      onChange("custom", { start: startDate, end: endDate });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => handlePeriodClick(period.value)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            value === period.value
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {period.label}
        </button>
      ))}

      {showCustom && (
        <div className="flex items-center gap-2 ml-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-sm"
          />
          <button
            onClick={handleCustomApply}
            disabled={!startDate || !endDate}
            className="px-3 py-1.5 text-sm bg-gold text-black rounded-lg disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};
