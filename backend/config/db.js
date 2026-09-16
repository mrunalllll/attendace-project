// ─────────────────────────────────────────────
//  db.js — sql.js (WebAssembly SQLite) wrapper
//  • No MySQL / XAMPP needed — DB lives in voting.db
//  • Auto-creates schema + seeds admin on first run
//  • Exposes the same .execute(sql, params) interface
//    the routes already use, so routes stay compatible
// ─────────────────────────────────────────────
const fs      = require('fs');
const path    = require('path');
const initSql = require('sql.js');

const DB_PATH = path.join(__dirname, '../voting.db');

// ── We export a promise that resolves to the db wrapper ──
// Routes await db, then call db.execute(sql, params)

let dbInstance = null; // cached after first init

async function getDb() {
  if (dbInstance) return dbInstance;

  const SQL = await initSql();

  // Load existing file or create fresh
  let db;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('✅ SQLite loaded from voting.db');
  } else {
    db = new SQL.Database();
    console.log('✅ SQLite created fresh (voting.db)');
  }

  // ── Helper: save DB to file after every write ──
  function save() {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  // ── Create schema ──────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      mobile      TEXT    NOT NULL UNIQUE,
      email       TEXT    DEFAULT NULL,
      password    TEXT    NOT NULL,
      address     TEXT    NOT NULL DEFAULT '',
      photo       TEXT    NOT NULL DEFAULT 'default.png',
      role        INTEGER NOT NULL DEFAULT 1,
      status      INTEGER NOT NULL DEFAULT 0,
      is_verified INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS candidates (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      party      TEXT    NOT NULL,
      mobile     TEXT    DEFAULT NULL,
      email      TEXT    DEFAULT NULL,
      photo      TEXT    NOT NULL DEFAULT 'default.png',
      manifesto  TEXT    DEFAULT NULL,
      status     INTEGER NOT NULL DEFAULT 1,
      votes      INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS votes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL UNIQUE,
      candidate_id INTEGER NOT NULL,
      ip_address   TEXT    DEFAULT NULL,
      voted_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS election_settings (
      id                  INTEGER PRIMARY KEY DEFAULT 1,
      election_name       TEXT    NOT NULL DEFAULT 'General Election 2025',
      election_status     TEXT    NOT NULL DEFAULT 'pending',
      start_date          TEXT    DEFAULT NULL,
      end_date            TEXT    DEFAULT NULL,
      allow_registration  INTEGER NOT NULL DEFAULT 1,
      winner_declared     INTEGER NOT NULL DEFAULT 0,
      winner_candidate_id INTEGER DEFAULT NULL
    );
    CREATE TABLE IF NOT EXISTS activity_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER DEFAULT NULL,
      action      TEXT    NOT NULL,
      description TEXT    DEFAULT NULL,
      ip_address  TEXT    DEFAULT NULL,
      user_agent  TEXT    DEFAULT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      message    TEXT DEFAULT NULL,
      type       TEXT DEFAULT 'info',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── Seed election row (only if missing) ───────
  const elecRow = db.exec("SELECT id FROM election_settings WHERE id=1");
  if (!elecRow.length || !elecRow[0].values.length) {
    db.run("INSERT INTO election_settings (id,election_name,election_status,allow_registration) VALUES (1,'General Election 2025','pending',1)");
  }

  // ── Seed admin account (only if missing) ──────
  //  Mobile: 9999999999  Password: Admin@123
  const adminRow = db.exec("SELECT id FROM users WHERE mobile='9999999999'");
  if (!adminRow.length || !adminRow[0].values.length) {
    db.run(`
      INSERT INTO users (name,mobile,email,password,address,role,status,is_verified)
      VALUES (
        'Super Admin','9999999999','admin@votesecure.com',
        '$2a$12$5eWQN8VEVgGetZHC7YeM9eYRvQGApkiUwii0sFmSvltbJlaX2y4li',
        'Admin Office',2,0,1
      )
    `);
  }

  // ── Seed sample candidates (only if missing) ──
  const candRow = db.exec("SELECT id FROM candidates LIMIT 1");
  if (!candRow.length || !candRow[0].values.length) {
    db.run(`
      INSERT INTO candidates (name,party,manifesto,status) VALUES
        ('Rajesh Kumar','National Progress Party','Committed to economic growth and education reform.',1),
        ('Priya Sharma','People''s Democratic Front','Focused on healthcare, women empowerment and rural development.',1),
        ('Arjun Mehta','United Citizens Alliance','Driving infrastructure development and digital India initiatives.',1)
    `);
  }

  save(); // persist initial schema + seed

  // ── Public interface ───────────────────────────
  // Mimics mysql2's: const [[row]] = await db.execute(sql, params)
  // Returns [ rows_array, fields ] so destructuring works the same way
  const wrapper = {
    // async execute(sql, params) → [ rowsArray ]
    // rowsArray is array of plain objects { col: val }
    execute(sql, params = []) {
      return new Promise((resolve, reject) => {
        try {
          const trimmed = sql.trim().toUpperCase();

          if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
            // SELECT — return array of row objects
            const results = db.exec(sql, params);
            if (!results.length) {
              resolve([[]]); // empty result — [[]] matches mysql2 behaviour
              return;
            }
            const { columns, values } = results[0];
            const rows = values.map(v => {
              const obj = {};
              columns.forEach((c, i) => { obj[c] = v[i]; });
              return obj;
            });
            resolve([rows]);
          } else {
            // INSERT / UPDATE / DELETE
            const stmt = db.prepare(sql);
            stmt.run(params);
            stmt.free();
            const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] ?? null;
            save();
            resolve([{ insertId: lastId, affectedRows: db.getRowsModified() }]);
          }
        } catch (err) {
          reject(err);
        }
      });
    },

    // getConnection() — returns a fake connection with begin/commit/rollback
    // We serialise transactions synchronously since sql.js is single-threaded
    getConnection() {
      return Promise.resolve({
        beginTransaction() { db.run('BEGIN'); return Promise.resolve(); },
        commit()           { db.run('COMMIT'); save(); return Promise.resolve(); },
        rollback()         { db.run('ROLLBACK'); return Promise.resolve(); },
        release()          { /* no-op */ },
        execute(sql, params = []) { return wrapper.execute(sql, params); },
      });
    },
  };

  dbInstance = wrapper;
  return wrapper;
}

// ── Proxy object: routes do  const db = require('../config/db')
//    then  await db.execute(...)  — the proxy forwards everything
//    to the async-initialised instance transparently.
const proxy = new Proxy({}, {
  get(_t, prop) {
    return (...args) => getDb().then(db => db[prop](...args));
  },
});

// Kick off initialisation immediately on require
getDb().catch(e => {
  console.error('❌ SQLite init failed:', e.message);
  process.exit(1);
});

module.exports = proxy;
