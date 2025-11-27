import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, color = "indigo" }) => {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  }[color] || "bg-gray-50 text-gray-600";

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md">
      <div className="flex items-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
          {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;