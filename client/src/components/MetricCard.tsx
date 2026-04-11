import type { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  trend?: string;
  trendColor?: string;
}

export default function MetricCard({
  icon, iconBg, iconColor, value, label, trend, trendColor = 'var(--success)'
}: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="metric-info">
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
        {trend && (
          <div className="metric-trend" style={{ color: trendColor }}>{trend}</div>
        )}
      </div>
    </div>
  );
}
