-- Per-school database (school_<id>.db)
-- Fully isolated: each school gets its own SQLite file so data never mixes.

CREATE TABLE IF NOT EXISTS academic_years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT UNIQUE NOT NULL,             -- e.g. "2026-2027"
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fee_structures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  academic_year TEXT NOT NULL,
  class_name TEXT NOT NULL,               -- e.g. "5th", "11th"
  stream TEXT DEFAULT NULL,               -- Science-Medical / Science-Non-Medical / Commerce / Arts / NULL
  fee_type TEXT NOT NULL,                 -- Monthly / Quarterly / Annual / Transport / Exam / Other
  label TEXT NOT NULL,                    -- display label e.g. "Tuition Fee - Monthly"
  amount REAL NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'Annual', -- Monthly/Quarterly/Annual/OneTime
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admission_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  father_name TEXT,
  mother_name TEXT,
  contact_number TEXT,
  address TEXT,
  class_name TEXT NOT NULL,
  section TEXT,
  stream TEXT DEFAULT NULL,               -- only for 11th/12th
  subjects TEXT DEFAULT NULL,             -- JSON array of subject tags, 11th/12th only
  academic_year TEXT NOT NULL,
  photo_data_url TEXT,
  total_fee REAL NOT NULL DEFAULT 0,
  concession REAL NOT NULL DEFAULT 0,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'Pending', -- Fully Paid / Partially Paid / Overdue / Pending
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(full_name);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  receipt_number TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  payment_mode TEXT NOT NULL,             -- Cash / Cheque / UPI / Bank Transfer / DD
  reference_number TEXT,
  fee_breakdown TEXT,                     -- JSON array [{label, amount}]
  payment_date TEXT NOT NULL,
  cashier_name TEXT,
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);

CREATE TABLE IF NOT EXISTS receipt_counters (
  academic_year TEXT PRIMARY KEY,
  next_number INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
