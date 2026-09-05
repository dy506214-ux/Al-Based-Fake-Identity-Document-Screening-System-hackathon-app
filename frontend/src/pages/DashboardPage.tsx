import { useState, useEffect } from 'react';
import { api } from '../api';

export default function DashboardPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchStats()
      .then((res) => {
        setData(res.stats);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#e8e0d0' }}>Loading stats...</div>;
  if (!data) return <div style={{ padding: 40, color: '#e8e0d0' }}>Failed to load stats.</div>;

  return (
    <div style={{ padding: 24, color: '#e8e0d0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Dashboard Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: '#1a1e12', padding: 20, borderRadius: 8, border: '1px solid rgba(74,90,42,0.3)' }}>
          <div style={{ fontSize: 12, color: '#7a8a58' }}>TOTAL USERS</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{data.users?.total || 0}</div>
        </div>
        <div style={{ background: '#1a1e12', padding: 20, borderRadius: 8, border: '1px solid rgba(74,90,42,0.3)' }}>
          <div style={{ fontSize: 12, color: '#7a8a58' }}>TOTAL DOCUMENTS</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>{data.documents?.total || 0}</div>
        </div>
        <div style={{ background: '#1a1e12', padding: 20, borderRadius: 8, border: '1px solid rgba(74,90,42,0.3)' }}>
          <div style={{ fontSize: 12, color: '#7a8a58' }}>PENDING REVIEWS</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8, color: '#cc9944' }}>{data.documents?.pendingReview || 0}</div>
        </div>
        <div style={{ background: '#1a1e12', padding: 20, borderRadius: 8, border: '1px solid rgba(74,90,42,0.3)' }}>
          <div style={{ fontSize: 12, color: '#7a8a58' }}>HIGH RISK DETECTED</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8, color: '#c87878' }}>{(data.risk?.high || 0) + (data.risk?.critical || 0)}</div>
        </div>
      </div>
    </div>
  );
}