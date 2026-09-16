// Fix admin password in voting.db
const bcrypt  = require('bcryptjs');
const initSql = require('sql.js');
const fs      = require('fs');

initSql().then(async SQL => {
  const buf  = fs.readFileSync('voting.db');
  const db   = new SQL.Database(buf);

  const hash = await bcrypt.hash('Admin@123', 12);
  db.run("UPDATE users SET password=? WHERE mobile='9999999999'", [hash]);

  // Verify
  const match = await bcrypt.compare('Admin@123', hash);
  console.log('New hash set, matches Admin@123:', match);

  // Save back to file
  const data = db.export();
  fs.writeFileSync('voting.db', Buffer.from(data));
  console.log('voting.db saved.');
});
