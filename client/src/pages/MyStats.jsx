import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../context/AuthContext';
import CourtMap from '../components/CourtMap';
import ZoneStats from '../components/ZoneStats';
import './PlayerStats.css';

export default function MyStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        axios.get(`${API}/api/players/${user.id}/stats`),
        axios.get(`${API}/api/sessions`),
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/api/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      setDeleteId(null);
      // Refresh stats
      const statsRes = await axios.get(`${API}/api/players/${user.id}/stats`);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading your stats…</div>;

  // Build shot data for court map from aggregated stats
  const courtData = {};
  stats.forEach(s => {
    courtData[s.zone_id] = { attempts: Number(s.total_attempts), makes: Number(s.total_makes) };
  });

  return (
    <div className="player-stats-page">
      <div className="page-header">
        <h1>My Stats</h1>
        <Link to="/sessions/new" className="btn btn-primary">+ Log Session</Link>
      </div>

      <div className="stats-layout">
        <div className="court-section card">
          <h3>Shot Chart</h3>
          <CourtMap shotData={courtData} readOnly />
        </div>
        <div className="table-section card">
          <h3>By Zone</h3>
          {stats.length === 0
            ? <p className="empty-msg">No shots logged yet.</p>
            : <ZoneStats stats={stats} />
          }
        </div>
      </div>

      <div className="sessions-section">
        <h2>Session History</h2>
        {sessions.length === 0 ? (
          <div className="card empty-state">
            <p>No sessions yet. <Link to="/sessions/new" style={{ color: 'var(--accent)' }}>Log your first session.</Link></p>
          </div>
        ) : (
          <div className="sessions-list">
            {sessions.map(session => {
              const totals = session.shots.reduce((a, s) => ({
                attempts: a.attempts + Number(s.attempts),
                makes: a.makes + Number(s.makes),
              }), { attempts: 0, makes: 0 });
              const pct = totals.attempts ? Math.round((totals.makes / totals.attempts) * 100) : null;

              return (
                <div key={session.id} className="session-row card">
                  <div className="session-main">
                    <div className="session-date">{new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</div>
                    {session.notes && <div className="session-notes">{session.notes}</div>}
                    <div className="session-meta">
                      {session.shots.length} zone{session.shots.length !== 1 ? 's' : ''}
                      {totals.attempts > 0 && <> · {totals.makes}/{totals.attempts} makes</>}
                    </div>
                  </div>
                  <div className="session-right">
                    {pct !== null && (
                      <div className="session-pct" style={{ color: pct >= 50 ? 'var(--make-green)' : 'var(--miss-red)' }}>
                        {pct}%
                      </div>
                    )}
                    <div className="session-actions">
                      <Link to={`/sessions/${session.id}/edit`} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>Edit</Link>
                      {deleteId === session.id ? (
                        <>
                          <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => handleDelete(session.id)}>Confirm</button>
                          <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => setDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => setDeleteId(session.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
