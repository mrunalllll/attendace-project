const http = require('http');

const body = JSON.stringify({ mob: '9999999999', pass: 'Admin@123', role: 2 });

const req = http.request({
  hostname: 'localhost', port: 5000,
  path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:',   data);
  });
});
req.write(body);
req.end();
