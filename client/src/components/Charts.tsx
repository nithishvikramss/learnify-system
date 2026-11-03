import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import type { SubjectAverage } from '../types';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface SubjectBarChartProps {
  data: SubjectAverage[];
}

interface BarTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { fullName: string } }[];
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 8, padding: '10px 14px', fontSize: 12
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{payload[0].payload.fullName}</p>
      <p>Average: <strong>{payload[0].value}%</strong></p>
    </div>
  );
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

function PieLabel({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: PieLabelProps) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

export function SubjectBarChart({ data }: SubjectBarChartProps) {
  if (!data.length) {
    return (
      <div className="empty-state">
        <p>No subject data available</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    name: d.subjectName.length > 12 ? d.subjectName.slice(0, 12) + '…' : d.subjectName,
    fullName: d.subjectName,
    average: d.averageMarks,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip content={<BarTooltip />} />
        <Bar dataKey="average" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
          <LabelList dataKey="average" position="top" style={{ fontSize: 10, fill: '#64748b' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PassFailPieChartProps {
  passPercentage: number;
  failPercentage: number;
}

export function PassFailPieChart({ passPercentage, failPercentage }: PassFailPieChartProps) {
  const data = [
    { name: 'Pass', value: passPercentage },
    { name: 'Fail', value: failPercentage },
  ].filter(d => d.value > 0);

  if (!data.length) {
    return <div className="empty-state"><p>No data available</p></div>;
  }

  const PIE_COLORS = ['#10b981', '#ef4444'];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={85}
          dataKey="value"
          labelLine={false}
          label={<PieLabel />}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>
          )}
        />
        <Tooltip formatter={(v) => typeof v === 'number' ? `${v.toFixed(1)}%` : v} />
      </PieChart>
    </ResponsiveContainer>
  );
}
