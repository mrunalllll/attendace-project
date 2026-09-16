const bcrypt   = require('bcryptjs');
const initSql  = require('sql.js');
const fs       = require('fs');

initSql().then(async SQL => {
  const buf = fs.readFileSync('voting.db');
  const db  = new SQL.Database(buf);

  const res  = db.exec("SELECT password FROM users WHERE mobile='9999999999'");
  const hash = res[0]?.values[0]?.[0];
  console.log('Hash in DB:', hash);

  const match = await bcrypt.compare('Admin@123', hash);
  console.log('Password matches:', match);

  // Also check role
  const res2 = db.exec("SELECT id,name,mobile,role,status FROM users WHERE mobile='9999999999'");
  console.log('User row:', res2[0]?.values[0]);
});
