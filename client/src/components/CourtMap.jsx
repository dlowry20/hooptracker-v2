import React from 'react';
import { ZONE_POSITIONS, ZONES } from './zones';
import './CourtMap.css';

// pct returns a value as % of total for display
function pct(makes, attempts) {
  if (!attempts) return null;
  return Math.round((makes / attempts) * 100);
}

function zoneColor(makes, attempts, selected) {
  if (selected) return 'var(--accent)';
  if (!attempts) return 'transparent';
  const p = makes / attempts;
  if (p >= 0.5) return 'rgba(61,214,140,0.75)';
  return 'rgba(245,101,101,0.75)';
}

export default function CourtMap({ shotData = {}, onZoneClick, selectedZone, readOnly = false }) {
  // shotData: { [zoneId]: { attempts, makes } }

  return (
    <div className="court-wrap">
      <svg
        viewBox="0 0 400 370"
        xmlns="http://www.w3.org/2000/svg"
        className="court-svg"
      >
        {/* Court background */}
        <rect x="0" y="0" width="400" height="370" fill="var(--near-black)" />

        {/* Boundary */}
        <rect x="10" y="10" width="380" height="350" fill="#1C2128" stroke="var(--border)" strokeWidth="1.5" rx="2" />

        {/* 3-point arc */}
        <path
          d="M 30 10 L 30 168 A 172 172 0 0 0 370 168 L 370 10"
          fill="none" stroke="var(--border)" strokeWidth="1.5"
        />

        {/* Lane / paint */}
        <rect x="152" y="10" width="96" height="148" fill="rgba(232,96,28,0.06)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Free throw circle */}
        <circle cx="200" cy="158" r="38" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="6 4" />

        {/* Backboard */}
        <line x1="172" y1="22" x2="228" y2="22" stroke="var(--court-tan)" strokeWidth="3" />

        {/* Rim */}
        <circle cx="200" cy="34" r="9" fill="none" stroke="var(--paint-orange)" strokeWidth="2" />

        {/* Restricted area arc */}
        <path d="M 176 158 A 24 24 0 0 0 224 158" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Elbow marks */}
        <line x1="152" y1="115" x2="140" y2="115" stroke="var(--border)" strokeWidth="1" />
        <line x1="248" y1="115" x2="260" y2="115" stroke="var(--border)" strokeWidth="1" />

        {/* Zone hit areas */}
        {ZONES.map(zone => {
          const pos = ZONE_POSITIONS[zone.id];
          const data = shotData[zone.id];
          const attempts = data?.attempts || 0;
          const makes = data?.makes || 0;
          const isSelected = selectedZone === zone.id;
          const hasData = attempts > 0;
          const p = pct(makes, attempts);
          const fill = zoneColor(makes, attempts, isSelected);
          const strokeColor = isSelected ? 'var(--accent)' : (hasData ? 'transparent' : 'var(--border)');

          return (
            <g
              key={zone.id}
              className={`zone-group ${readOnly ? 'readonly' : 'clickable'}`}
              onClick={() => !readOnly && onZoneClick && onZoneClick(zone.id)}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r="22"
                fill={fill}
                stroke={strokeColor}
                strokeWidth={isSelected ? 2 : 1}
                fillOpacity={hasData || isSelected ? 1 : 0.5}
              />
              <text
                x={pos.x}
                y={pos.y - (hasData ? 5 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight="700"
                fontFamily="Barlow Condensed, sans-serif"
                fill={isSelected ? '#fff' : (hasData ? '#fff' : 'var(--text-secondary)')}
              >
                {zone.id}
              </text>
              {hasData && (
                <text
                  x={pos.x}
                  y={pos.y + 8}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="Inter, sans-serif"
                  fill="rgba(255,255,255,0.9)"
                >
                  {p}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="court-legend">
        <span className="legend-item"><span className="legend-dot green" />≥50%</span>
        <span className="legend-item"><span className="legend-dot red" />&lt;50%</span>
        <span className="legend-item"><span className="legend-dot empty" />No data</span>
      </div>
    </div>
  );
}
