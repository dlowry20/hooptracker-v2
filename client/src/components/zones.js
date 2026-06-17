export const ZONES = [
  { id: 1,  label: 'Left Corner 3' },
  { id: 2,  label: 'Left Wing 3' },
  { id: 3,  label: 'Center 3' },
  { id: 4,  label: 'Right Wing 3' },
  { id: 5,  label: 'Right Corner 3' },
  { id: 6,  label: 'Left Short Corner' },
  { id: 7,  label: 'Left Elbow' },
  { id: 8,  label: 'Right Elbow' },
  { id: 9,  label: 'Right Short Corner' },
  { id: 10, label: 'Free Throw' },
];

export const ZONE_MAP = Object.fromEntries(ZONES.map(z => [z.id, z.label]));

// Approximate click regions on the court SVG (viewBox 0 0 400 360)
// Each zone is defined as a clickable polygon or circle region
export const ZONE_POSITIONS = {
  1:  { x: 28,  y: 48  },  // Left Corner 3
  2:  { x: 69,  y: 280 },  // Left Wing 3
  3:  { x: 200, y: 335 },  // Center 3
  4:  { x: 331, y: 280 },  // Right Wing 3
  5:  { x: 372, y: 48  },  // Right Corner 3
  6:  { x: 108, y: 58  },  // Left Short Corner
  7:  { x: 138, y: 145 },  // Left Elbow
  8:  { x: 262, y: 145 },  // Right Elbow
  9:  { x: 292, y: 58  },  // Right Short Corner
  10: { x: 200, y: 145 },  // Free Throw
};
