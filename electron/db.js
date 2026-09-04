const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { app } = require('electron');

// ---------------------------------------------------------------------------
// Storage layout
// ---------------------------------------------------------------------------
// <userData>/eduledger-data/
//   org.db                 -> organization profile + school registry
//   school_<id>.db          -> fully isolated per-school data
//   backups/                -> exported JSON / raw .db backups
//
// Using one physical SQLite file per school gives real isolation: deleting or
// archiving a school never touches another school's rows, and a raw-file
// backup of one school never leaks another school's data.
// ---------------------------------------------------------------------------

function getDataDir() {
  const dir = path.join(app.getPath('userData'), 'eduledger-data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const backups = path.join(dir, 'backups');
  if (!fs.existsSync(backups)) fs.mkdirSync(backups, { recursive: true });
  return dir;
}

function readSchemaFile(name) {
  // Works both in dev (electron/) and packaged (resources/) layouts.
  const devPath = path.join(__dirname, name);
  if (fs.existsSync(devPath)) return fs.readFileSync(devPath, 'utf-8');
  const prodPath = path.join(process.resourcesPath, name);
  return fs.readFileSync(prodPath, 'utf-8');
}

let orgDb = null;
const schoolDbs = new Map();

function getOrgDb() {
  if (orgDb) return orgDb;
  const dbPath = path.join(getDataDir(), 'org.db');
  orgDb = new Database(dbPath);
  orgDb.pragma('journal_mode = WAL');
  orgDb.pragma('foreign_keys = ON');
  orgDb.exec(readSchemaFile('schema_org.sql'));
  return orgDb;
}

function getSchoolDb(schoolId) {
  const id = Number(schoolId);
  if (schoolDbs.has(id)) return schoolDbs.get(id);
  const dbPath = path.join(getDataDir(), `school_${id}.db`);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(readSchemaFile('schema_school.sql'));
  schoolDbs.set(id, db);
  return db;
}

function schoolDbPath(schoolId) {
  return path.join(getDataDir(), `school_${Number(schoolId)}.db`);
}

function closeAll() {
  if (orgDb) {
    orgDb.close();
    orgDb = null;
  }
  for (const db of schoolDbs.values()) db.close();
  schoolDbs.clear();
}

function closeSchoolDb(schoolId) {
  const id = Number(schoolId);
  if (schoolDbs.has(id)) {
    schoolDbs.get(id).close();
    schoolDbs.delete(id);
  }
}

module.exports = {
  getDataDir,
  getOrgDb,
  getSchoolDb,
  schoolDbPath,
  closeAll,
  closeSchoolDb,
};
