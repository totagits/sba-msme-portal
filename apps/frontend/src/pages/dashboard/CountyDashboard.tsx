import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';
import { formatNumber } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CountyDashboard() {
  const { data: countyData, isLoading } = useQuery({ queryKey: ['msmes-by-county'], queryFn: () => analyticsApi.msmesByCounty().then(r => r.data.data) });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">County Dashboard</h1>
          <p className="page-subtitle">MSME registration progress across all 15 counties of Liberia</p>
        </div>
      </div>

      {/* County cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4"><div className="skeleton h-24 rounded" /></div>
        )) : (countyData || []).map((c: any) => (
          <div key={c.countyId} className="card p-4 hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">{c.county} County</h3>
                <p className="text-xs text-muted-foreground">{c.approved} approved of {c.total} total</p>
              </div>
              <span className="chip chip-blue">{formatNumber(c.total)}</span>
            </div>
            <div className="progress-bar mb-2">
              <div className="progress-fill" style={{ width: c.total > 0 ? `${Math.round((c.approved / c.total) * 100)}%` : '0%' }} />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span className="text-green-600 font-medium">👥 Youth: {formatNumber(c.youth)}</span>
              <span className="text-pink-600 font-medium">👩 Women: {formatNumber(c.women)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Chart */}
      <div className="card">
        <div className="card-header"><p className="card-title">County Comparison — Total vs Approved MSMEs</p></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={countyData || []} margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="county" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="total" fill="#1e3a5f" name="Total MSMEs" radius={[3,3,0,0]} />
              <Bar dataKey="approved" fill="#15803d" name="Approved" radius={[3,3,0,0]} />
              <Bar dataKey="youth" fill="#d97706" name="Youth-Led" radius={[3,3,0,0]} />
              <Bar dataKey="women" fill="#dc2626" name="Women-Led" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
