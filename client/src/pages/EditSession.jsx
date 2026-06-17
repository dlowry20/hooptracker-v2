import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import CourtMap from '../components/CourtMap';
import { ZONES } from '../components/zones';
import './SessionForm.css';

export default function EditSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [zoneData, setZoneData] = useState({}); // { [zoneId]: { makes, misses } }
  const [selectedZone, setSelectedZone] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const clickTimers = useRef({});

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axios.get(`${API}/api/sessions`);
        const session = res.data.find(s => s.id === parseInt(id));
        if (!session) { navigate('/my-stats'); return; }
        setDate(session.session_date.split('T')[0]);
        setNotes(session.notes || '');
        const zd = {};
        session.shots.forEach(shot => {
          zd[shot.zone_id] = {
            makes: shot.makes,
            misses: shot.attempts - shot.makes,
          };
        });
        setZoneData(zd);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  const handleZoneClick = (zoneId) => {
    setSelectedZone(zoneId === selectedZone ? null : zoneId);
  };

  const adjustCount = (zoneId, field, delta) => {
    setZoneData(prev => {
      const current = prev[zoneId]?.[field] ?? 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [zoneId]: { makes: 0, misses: 0, ...prev[zoneId], [field]: next },
      };
    });
  };

  // Debounce single-click so it doesn't fire when double-clicking
  const handleCounterClick = (zoneId, field) => {
    const key = `${zoneId}-${field}`;
    if (clickTimers.current[key]) return; // double-click in progress, ignore
    clickTimers.current[key] = setTimeout(() => {
      delete clickTimers.current[key];
      adjustCount(zoneId, field, 1);
    }, 220);
  };

  const handleCounterDoubleClick = (zoneId, field) => {
    const key = `${zoneId}-${field}`;
    if (clickTimers.current[key]) {
      clearTimeout(clickTimers.current[key]);
      delete clickTimers.current[key];
    }
    adjustCount(zoneId, field, -1);
  };

  const getVal = (zoneId, field) => zoneData[zoneId]?.[field] ?? 0;

  const validate = () => {
    const entries = Object.entries(zoneData).filter(([, v]) => (v.makes || 0) + (v.misses || 0) > 0);
    if (entries.length === 0) return 'Record at least one shot in any zone.';
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    const shots = Object.entries(zoneData)
      .filter(([, v]) => (v.makes || 0) + (v.misses || 0) > 0)
      .map(([zoneId, v]) => ({
        zone_id: parseInt(zoneId),
        attempts: (v.makes || 0) + (v.misses || 0),
        makes: v.makes || 0,
      }));

    setSaving(true);
    try {
      await axios.put(`${API}/api/sessions/${id}`, { session_date: date, notes: notes || null, shots });
      navigate('/my-stats');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update session');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading session…</div>;

  const courtData = {};
  Object.entries(zoneData).forEach(([zid, v]) => {
    const attempts = (v.makes || 0) + (v.misses || 0);
    if (attempts > 0) courtData[zid] = { attempts, makes: v.makes || 0 };
  });
  const usedZones = Object.keys(courtData).length;

  return (
    <div className="session-form-page">
      <div className="page-header">
        <h1>Edit Session</h1>
      </div>

      <div className="session-form-layout">
        <div className="session-left">
          <div className="card">
            <div className="form-row">
              <div className="form-group">
                <label>Session Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Notes (optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Morning practice" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-label">Shot Zones</h3>
            <p className="section-hint">Click to add a make or miss. Double-click to subtract.</p>

            <div className="zones-grid">
              {ZONES.map(zone => {
                const isActive = selectedZone === zone.id;
                const makes = getVal(zone.id, 'makes');
                const misses = getVal(zone.id, 'misses');
                const attempts = makes + misses;
                const hasData = attempts > 0;

                return (
                  <div
                    key={zone.id}
                    className={`zone-input-card ${isActive ? 'active' : ''} ${hasData ? 'has-data' : ''}`}
                    onClick={() => setSelectedZone(zone.id)}
                  >
                    <div className="zone-input-header">
                      <span className="zone-badge">{zone.id}</span>
                      <span className="zone-input-label">{zone.label}</span>
                      {hasData && (
                        <span className="zone-attempts-badge">{makes}/{attempts}</span>
                      )}
                    </div>
                    <div className="zone-counters" onClick={e => e.stopPropagation()}>
                      <div
                        className="zone-counter makes"
                        onClick={() => handleCounterClick(zone.id, 'makes')}
                        onDoubleClick={() => handleCounterDoubleClick(zone.id, 'makes')}
                        title="Click to add make · Double-click to remove"
                      >
                        <span className="counter-value">{makes}</span>
                        <span className="counter-label">Makes</span>
                      </div>
                      <div className="zone-counter-divider" />
                      <div
                        className="zone-counter misses"
                        onClick={() => handleCounterClick(zone.id, 'misses')}
                        onDoubleClick={() => handleCounterDoubleClick(zone.id, 'misses')}
                        title="Click to add miss · Double-click to remove"
                      >
                        <span className="counter-value">{misses}</span>
                        <span className="counter-label">Misses</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="session-right">
          <div className="card court-preview-card">
            <h3 className="section-label">Court Preview</h3>
            <CourtMap shotData={courtData} onZoneClick={handleZoneClick} selectedZone={selectedZone} />
            <div className="zone-count">{usedZones} zone{usedZones !== 1 ? 's' : ''} entered</div>
          </div>

          <div className="submit-area">
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary submit-btn" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button className="btn btn-secondary submit-btn" onClick={() => navigate('/my-stats')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
