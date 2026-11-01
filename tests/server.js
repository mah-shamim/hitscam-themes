// নির্ভরতা-মুক্ত স্ট্যাটিক সার্ভার (টেস্ট ও লোকাল প্রিভিউ): node tests/server.js
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = +process.env.PORT || 4173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT) || /(^|[\\/])(node_modules|\.git)([\\/]|$)/.test(path.relative(ROOT, file))) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) {
      if (/\.html$/.test(url)) return fs.readFile(path.join(ROOT, '404.html'), (e2, b2) => { res.writeHead(404, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' }); res.end(e2 ? 'Not found' : b2); });
      res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found: ' + url);
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log('HitsCam template: http://127.0.0.1:' + PORT));
