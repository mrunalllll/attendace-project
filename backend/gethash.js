const bcrypt = require('bcryptjs');
bcrypt.hash('Admin@123', 12).then(h => console.log(h));
