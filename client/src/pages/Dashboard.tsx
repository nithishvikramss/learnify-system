import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, TrendingUp, AlertTriangle,
  Award, CheckCircle, XCircle, Lightbulb
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { SubjectBarChart, PassFailPieChart } from '../components/Charts';
import { getAnalyticsSummary, getErrorMessage } from '../api/api';
import type { AnalyticsSummary } from '../types';

export default function Dashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getAnalyticsSummary()
      .then(setSummary)
      .catch(err => setError(getErrorMessage(err, 'Failed to load analytics.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <span>Loading analytics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const s = summary!;

  return (
    <div className="page-content">
      {/* Metric Cards */}
      <div className="metrics-grid">
        <MetricCard
          icon={<Users size={20} />}
          iconBg="#e0e7ff" iconColor="#4f46e5"
          value={s.totalStudents}
          label="Total Students"
          trend={`${s.totalSubjects} subjects`}
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          iconBg="#dcfce7" iconColor="#16a34a"
          value={`${s.classAverage}%`}
          label="Class Average"
          trend={s.classAverage >= 70 ? 'Excellent' : s.classAverage >= 50 ? 'Average' : 'Needs Improvement'}
          trendColor={s.classAverage >= 70 ? 'var(--success)' : s.classAverage >= 50 ? 'var(--warning)' : 'var(--danger)'}
        />
        <MetricCard
          icon={<CheckCircle size={20} />}
          iconBg="#dcfce7" iconColor="#16a34a"
          value={`${s.passPercentage}%`}
          label="Pass Rate"
          trend="Passed every subject"
          trendColor="var(--success)"
        />
        <MetricCard
          icon={<XCircle size={20} />}
          iconBg="#fee2e2" iconColor="#ef4444"
          value={s.belowThresholdCount.toString()}
          label="Average Below 40%"
          trend={s.belowThresholdCount > 0 ? 'Needs attention' : 'All good!'}
          trendColor={s.belowThresholdCount > 0 ? 'var(--danger)' : 'var(--success)'}
        />
        <MetricCard
          icon={<Award size={20} />}
          iconBg="#fef3c7" iconColor="#d97706"
          value={s.topPerformerName || '—'}
          label="Top Performer"
          trend={s.topPerformerScore ? `${s.topPerformerScore}%` : ''}
          trendColor="var(--warning)"
        />
        <MetricCard
          icon={<AlertTriangle size={20} />}
          iconBg="#fef9c3" iconColor="#ca8a04"
          value={s.lowestSubject || '—'}
          label="Weakest Subject"
          trend="Needs focus"
          trendColor="var(--warning)"
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Subject-wise Average Marks</span>
            <span className="badge badge-primary">
              <BookOpen size={10} /> {s.subjectAverages.length} subjects
            </span>
          </div>
          <SubjectBarChart data={s.subjectAverages} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Pass / Fail Distribution</span>
            <span className="badge badge-success">
              {s.passPercentage}% pass rate
            </span>
          </div>
          <PassFailPieChart
            passPercentage={s.passPercentage}
            failPercentage={s.failPercentage}
          />
        </div>
      </div>

      <div className="two-col-grid">
        {/* Top Students */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Performers</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reports')}>
              View All
            </button>
          </div>
          {s.topStudents.length === 0 ? (
            <div className="empty-state"><p>No student data yet</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Dept</th>
                    <th>Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {s.topStudents.map((st, i) => (
                    <tr key={st.studentId}>
                      <td>
                        <span className={`badge ${i === 0 ? 'badge-warning' : i === 1 ? 'badge-gray' : 'badge-primary'}`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{st.studentName}</td>
                      <td><span className="badge badge-info">{st.department}</span></td>
                      <td style={{ fontWeight: 600 }}>{st.averageMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Insights</span>
            <Lightbulb size={16} color="var(--warning)" />
          </div>
          {s.insights.length === 0 ? (
            <div className="empty-state"><p>Add students and marks to see insights</p></div>
          ) : (
            <div className="insights-list">
              {s.insights.map((insight, i) => (
                <div key={i} className="insight-item">
                  <Lightbulb size={14} />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
