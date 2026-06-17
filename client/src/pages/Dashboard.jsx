import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { ZONES } from '../components/zones';
import './Dashboard.css';

function overallPct(stats) {
  const attempts = stats.reduce((a, s) => a + Number(s.total_attempts), 0);
  const makes = stats.reduce((a, s) => a + Number(s.total_makes), 0);
  if (!attempts) return null;
  return { pct: Math.round((makes / attempts) * 100), attempts, makes };
}

export default function Dashboard() {
  const [players, setPlayers] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const playersRes = await axios.get(`${API}/api/players`);
        setPlayers(playersRes.data);
        const statsResults = await Promise.all(
          playersRes.data.map(p => axios.get(`${API}/api/players/${p.id}/stats`))
        );
        const map = {};
        playersRes.data.forEach((p, i) => {
          map[p.id] = statsResults[i].data;
        });
        setStatsMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="loading">Loading team stats…</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Team Dashboard</h1>
      </div>

      {players.length === 0 ? (
        <div className="empty-state card">
          <p>No players yet. Share the app so teammates can register.</p>
        </div>
      ) : (
        <div className="players-grid">
          {players.map(player => {
            const stats = statsMap[player.id] || [];
            const overall = overallPct(stats);
            return (
              <Link key={player.id} to={`/players/${player.id}`} className="player-card card">
                <div className="player-card-header">
                  <div className="player-avatar">{player.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="player-name">{player.name}</div>
                    <div className="player-email">{player.email}</div>
                  </div>
                </div>
                <hr className="divider" />
                {overall ? (
                  <div className="player-overall">
                    <div className="overall-pct" style={{ color: overall.pct >= 50 ? 'var(--make-green)' : 'var(--miss-red)' }}>
                      {overall.pct}%
                    </div>
                    <div className="overall-label">Overall FG</div>
                    <div className="overall-sub">{overall.makes}/{overall.attempts} from {stats.length} zone{stats.length !== 1 ? 's' : ''}</div>
                  </div>
                ) : (
                  <div className="no-sessions">No sessions logged yet</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
