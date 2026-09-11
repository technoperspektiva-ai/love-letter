CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  secret TEXT NOT NULL UNIQUE,
  recipient TEXT NOT NULL,
  opener TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  signature TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'starry',
  portrait_key TEXT,
  unlock_at INTEGER,
  created_at INTEGER NOT NULL,
  opened_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_letters_secret ON letters(secret);
CREATE INDEX IF NOT EXISTS idx_letters_unlock_at ON letters(unlock_at);
