/**
 * StatCard Component
 *
 * Mobile-first metric display card for admin dashboard
 * - Horror-themed styling (dark purple, lime, cyan)
 * - Responsive design (stacks on mobile, grid on desktop)
 * - Skeleton loading state
 * - Number formatting
 */

import type { ReactNode } from 'react';
import { Skeleton } from '../ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  isLoading?: boolean;
  colorScheme?: 'lime' | 'cyan' | 'pink' | 'purple';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  isLoading = false,
  colorScheme = 'cyan',
}: StatCardProps) {
  const colorClasses = {
    lime: 'border-[#32CD32] bg-[#32CD32]/5',
    cyan: 'border-[#00CED1] bg-[#00CED1]/5',
    pink: 'border-[#FF1493] bg-[#FF1493]/5',
    purple: 'border-[#4A3258] bg-[#4A3258]/5',
  };

  const textColorClasses = {
    lime: 'text-[#32CD32]',
    cyan: 'text-[#00CED1]',
    pink: 'text-[#FF1493]',
    purple: 'text-[#9B8FB5]',
  };

  const trendColors = {
    up: 'text-[#32CD32]',
    down: 'text-[#FF1493]',
    neutral: 'text-[#9B8FB5]',
  };

  if (isLoading) {
    return (
      <div
        className={`
          rounded-lg border-2 p-4 md:p-6
          ${colorClasses[colorScheme]}
          transition-all hover:scale-[1.02]
        `}
      >
        <Skeleton className="h-4 w-24 mb-3 bg-[#4A3258]/30" />
        <Skeleton className="h-10 w-32 mb-2 bg-[#4A3258]/30" />
        {subtitle && <Skeleton className="h-3 w-20 bg-[#4A3258]/30" />}
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-lg border-2 p-4 md:p-6
        ${colorClasses[colorScheme]}
        transition-all hover:scale-[1.02] hover:shadow-lg
        hover:shadow-${colorScheme === 'lime' ? '[#32CD32]' : colorScheme === 'cyan' ? '[#00CED1]' : colorScheme === 'pink' ? '[#FF1493]' : '[#9B8FB5]'}/20
      `}
    >
      {/* Title + Icon */}
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-sm md:text-base text-[#9B8FB5] font-semibold"
          style={{ fontFamily: 'Tourney, cursive' }}
        >
          {title}
        </h3>
        {icon && <div className={textColorClasses[colorScheme]}>{icon}</div>}
      </div>

      {/* Value */}
      <div
        className={`text-3xl md:text-4xl font-bold ${textColorClasses[colorScheme]} mb-1`}
        style={{ fontFamily: 'Tourney, cursive' }}
      >
        {value}
      </div>

      {/* Subtitle / Trend */}
      <div className="flex items-center gap-2 flex-wrap">
        {subtitle && (
          <span
            className="text-xs md:text-sm text-[#9B8FB5]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {subtitle}
          </span>
        )}
        {trend && trendValue && (
          <span
            className={`text-xs md:text-sm font-semibold ${trendColors[trend]}`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {trend === 'up' && '↑ '}
            {trend === 'down' && '↓ '}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
