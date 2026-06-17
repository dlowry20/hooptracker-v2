import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import CourtMap from '../components/CourtMap';
import ZoneStats from '../components/ZoneStats';
import './PlayerStats.css';

export default function PlayerStats() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, statsRes, sessionsRes] = await Promise.all([
          axios.get(`${API}/api/players`),
          axios.get(`${API}/api/players/${id}/stats`),
          axios.get(`${API}/api/players/${id}/sessions`),
        ]);
        setPlayer(playersRes.data.find(p => p.id === parseInt(id)));
        setStats(statsRes.data);
        setSessions(sessionsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="loading">Loading…</div>;
  if (!player) return <div className="loading">Player not found.</div>;

  const courtData = {};
  stats.forEach(s => {
    courtData[s.zone_id] = { attempts: Number(s.total_attempts), makes: Number(s.total_makes) };
  });

  return (
    <div className="player-stats-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '6px 12px' }}>← Back</Link>
          <h1>{player.name}</h1>
        </div>
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
          <div className="card empty-state"><p>No sessions logged yet.</p></div>
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
                  {pct !== null && (
                    <div className="session-pct" style={{ color: pct >= 50 ? 'var(--make-green)' : 'var(--miss-red)' }}>
                      {pct}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
