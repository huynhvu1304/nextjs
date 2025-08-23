// server.js
const { createServer } = require('http');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : 'novashop.io.vn';
const port = process.env.PORT || 4000;  // đổi sang 4000, không dùng 3000

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();


app.prepare().then(() => {
  createServer((req, res) => {
    // Tùy chỉnh server ở đây nếu muốn, ví dụ check URL
    handle(req, res);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
