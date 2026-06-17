import React from 'react';
import { ZONES } from './zones';
import './ZoneStats.css';

function pct(makes, attempts) {
  if (!attempts) return '—';
  return `${Math.round((makes / attempts) * 100)}%`;
}

function pctNum(makes, attempts) {
  if (!attempts) return -1;
  return makes / attempts;
}

export default function ZoneStats({ stats = [] }) {
  // stats: [{ zone_id, total_makes, total_attempts }]
  const statsMap = Object.fromEntries(stats.map(s => [s.zone_id, s]));

  const totals = stats.reduce(
    (acc, s) => ({
      attempts: acc.attempts + Number(s.total_attempts),
      makes: acc.makes + Number(s.total_makes),
    }),
    { attempts: 0, makes: 0 }
  );

  return (
    <div className="zone-stats">
      <table className="stats-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Zone</th>
            <th>Attempts</th>
            <th>Makes</th>
            <th>FG%</th>
          </tr>
        </thead>
        <tbody>
          {ZONES.map(zone => {
            const s = statsMap[zone.id];
            const attempts = s ? Number(s.total_attempts) : 0;
            const makes = s ? Number(s.total_makes) : 0;
            const p = pctNum(makes, attempts);
            const hasData = attempts > 0;

            return (
              <tr key={zone.id} className={hasData ? '' : 'no-data'}>
                <td className="zone-num">{zone.id}</td>
                <td className="zone-label">{zone.label}</td>
                <td>{hasData ? attempts : '—'}</td>
                <td>{hasData ? makes : '—'}</td>
                <td>
                  {hasData ? (
                    <span className={`pct-badge ${p >= 0.5 ? 'good' : 'poor'}`}>
                      {pct(makes, attempts)}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        {totals.attempts > 0 && (
          <tfoot>
            <tr>
              <td colSpan="2" className="total-label">Overall</td>
              <td>{totals.attempts}</td>
              <td>{totals.makes}</td>
              <td>
                <span className={`pct-badge ${pctNum(totals.makes, totals.attempts) >= 0.5 ? 'good' : 'poor'}`}>
                  {pct(totals.makes, totals.attempts)}
                </span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
