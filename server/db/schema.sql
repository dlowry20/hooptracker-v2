-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shots (one row per zone per session)
CREATE TABLE IF NOT EXISTS shots (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  zone_id INTEGER NOT NULL CHECK (zone_id BETWEEN 1 AND 10),
  attempts INTEGER NOT NULL CHECK (attempts >= 0),
  makes INTEGER NOT NULL CHECK (makes >= 0),
  CONSTRAINT makes_lte_attempts CHECK (makes <= attempts),
  UNIQUE (session_id, zone_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_shots_session_id ON shots(session_id);
