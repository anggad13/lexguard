import React from 'react';
import type { CategoryDistribution as CategoryDistType } from '../types';

interface CategoryDistributionProps {
  distribution: CategoryDistType[];
  totalClauses: number;
}

export const CategoryDistribution: React.FC<CategoryDistributionProps> = ({
  distribution,
  totalClauses,
}) => {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Clause Category Distribution</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Breakdown of detected clause classifications across the 7 project categories.
        </p>
      </div>

      <div className="space-y-3 pt-1">
        {distribution.map((item) => {
          const widthPct = totalClauses > 0 ? (item.count / maxCount) * 100 : 0;
          const isRisky = item.risk_weight > 0;

          return (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-medium text-slate-800 truncate">{item.category}</span>
                  {isRisky ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      weight {item.risk_weight}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                      neutral
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 font-mono text-slate-500">
                  <span className="font-semibold text-slate-800">{item.count}</span>
                  <span className="text-slate-400">({item.percentage}%)</span>
                </div>
              </div>

              {/* Restrained horizontal bar */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.count === 0
                      ? 'bg-transparent'
                      : isRisky
                      ? 'bg-slate-700'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.max(widthPct, item.count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
