-- Organization-level database (org.db)
-- Holds the parent organization profile and the registry of up to 5 schools.
-- Each school's actual academic/financial data lives in its own isolated
-- database file (school_<id>.db) — see schema_school.sql.

CREATE TABLE IF NOT EXISTS organization (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'My Organization',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO organization (id, name) VALUES (1, 'My Organization');

CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,              -- e.g. sch1, used for db filename + receipt prefix fallback
  name TEXT NOT NULL,
  affiliation_code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_data_url TEXT,                     -- base64 data URL for the school logo
  stamp_data_url TEXT,                    -- base64 data URL for stamp/signature image
  receipt_prefix TEXT NOT NULL DEFAULT 'SCH',
  active_academic_year TEXT NOT NULL DEFAULT '2026-2027',
  theme_accent TEXT NOT NULL DEFAULT 'emerald',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived INTEGER NOT NULL DEFAULT 0
);
