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
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      mobile        TEXT    NOT NULL UNIQUE,
      email         TEXT    DEFAULT NULL,
      password      TEXT    NOT NULL,
      address       TEXT    NOT NULL DEFAULT '',
      photo         TEXT    NOT NULL DEFAULT 'default.png',
      role          INTEGER NOT NULL DEFAULT 1,
      status        INTEGER NOT NULL DEFAULT 0,
      is_verified   INTEGER NOT NULL DEFAULT 0,
      department_id INTEGER DEFAULT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
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

    CREATE TABLE IF NOT EXISTS departments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      code        TEXT    NOT NULL DEFAULT '',
      slug        TEXT    NOT NULL DEFAULT '',
      description TEXT    DEFAULT NULL,
      hod_name    TEXT    DEFAULT NULL,
      hod_photo   TEXT    DEFAULT NULL,
      banner      TEXT    DEFAULT NULL,
      image       TEXT    DEFAULT NULL,
      established TEXT    DEFAULT NULL,
      seats       INTEGER DEFAULT NULL,
      status      INTEGER NOT NULL DEFAULT 1,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      title            TEXT    NOT NULL,
      slug             TEXT    NOT NULL DEFAULT '',
      description      TEXT    DEFAULT NULL,
      department_id    INTEGER DEFAULT NULL,
      category         TEXT    NOT NULL DEFAULT 'Other',
      event_date       TEXT    DEFAULT NULL,
      start_time       TEXT    DEFAULT NULL,
      end_time         TEXT    DEFAULT NULL,
      venue            TEXT    DEFAULT NULL,
      organizer        TEXT    DEFAULT NULL,
      poster           TEXT    DEFAULT NULL,
      registration_info TEXT   DEFAULT NULL,
      status           TEXT    NOT NULL DEFAULT 'upcoming',
      is_published     INTEGER NOT NULL DEFAULT 1,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS event_photos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id   INTEGER NOT NULL,
      photo      TEXT    NOT NULL,
      title      TEXT    DEFAULT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    DEFAULT NULL,
      photo         TEXT    NOT NULL,
      category      TEXT    NOT NULL DEFAULT 'General',
      department_id INTEGER DEFAULT NULL,
      event_id      INTEGER DEFAULT NULL,
      is_featured   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (event_id)      REFERENCES events(id)      ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      body         TEXT    DEFAULT NULL,
      type         TEXT    NOT NULL DEFAULT 'info',
      department_id INTEGER DEFAULT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      is_pinned    INTEGER NOT NULL DEFAULT 0,
      expires_at   TEXT    DEFAULT NULL,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS department_faculty (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      name          TEXT    NOT NULL,
      designation   TEXT    DEFAULT NULL,
      email         TEXT    DEFAULT NULL,
      photo         TEXT    DEFAULT NULL,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );
  `);

  // ── Migrate existing DB: add department_id to users if missing ────
  try {
    db.run('ALTER TABLE users ADD COLUMN department_id INTEGER DEFAULT NULL');
    save();
  } catch (_) { /* column already exists — safe to ignore */ }

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

  // ── Seed sample departments (only if missing) ──
  const deptRow = db.exec("SELECT id FROM departments LIMIT 1");
  if (!deptRow.length || !deptRow[0].values.length) {
    const depts = [
      ['Computer Science & Engineering', 'CSE', 'cse', 'The CSE department offers cutting-edge programs in software development, algorithms, and computer systems.', 'Dr. Rajesh Patil', 1],
      ['Artificial Intelligence & ML', 'AIML', 'aiml', 'Pioneering the future with AI, Machine Learning, Deep Learning, and Data Science programs.', 'Dr. Priya Sharma', 2],
      ['Information Technology', 'IT', 'it', 'Focused on IT infrastructure, networking, cybersecurity, and modern web technologies.', 'Dr. Amit Joshi', 3],
      ['Electronics & Telecomm.', 'ENTC', 'entc', 'Covering electronics, embedded systems, VLSI design, and telecommunications engineering.', 'Dr. Sunil Kulkarni', 4],
      ['Mechanical Engineering', 'MECH', 'mechanical', 'Comprehensive mechanical engineering covering design, manufacturing, thermal, and automation.', 'Dr. Vikram Singh', 5],
      ['Civil Engineering', 'CIVIL', 'civil', 'Building tomorrow\'s infrastructure with structural, environmental, and transportation engineering.', 'Dr. Neha Desai', 6],
      ['MBA', 'MBA', 'mba', 'Master of Business Administration — leadership, strategy, finance, and entrepreneurship.', 'Dr. Anand Kapoor', 7],
      ['MCA', 'MCA', 'mca', 'Master of Computer Applications — advanced computing, software engineering, and AI.', 'Dr. Meena Iyer', 8],
    ];
    for (const [name, code, slug, description, hod_name, sort_order] of depts) {
      db.run(
        `INSERT INTO departments (name,code,slug,description,hod_name,status,sort_order)
         VALUES (?,?,?,?,?,1,?)`,
        [name, code, slug, description, hod_name, sort_order]
      );
    }
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
