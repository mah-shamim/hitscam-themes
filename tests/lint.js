#!/usr/bin/env node
// নির্ভরতা-মুক্ত স্ট্যাটিক চেক: JS সিনট্যাক্স, ভাঙা লিংক, HTML বেসিক, ডুপ্লিকেট id, alt ছাড়া ছবি, CDN পিন।
// ব্যবহার: node tests/lint.js   (সমস্যা থাকলে exit code 1)
const fs = require('fs'), path = require('path'), os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const err = (file, msg) => errors.push(`${path.relative(ROOT, file)}: ${msg}`);
const read = f => fs.readFileSync(f, 'utf8');
const walk = (dir, ext, out = []) => {
  for (const n of fs.readdirSync(dir)) {
    if (['node_modules', '.git', '.github', 'playwright-report', 'test-results'].includes(n)) continue;
    const p = path.join(dir, n), st = fs.statSync(p);
    if (st.isDirectory()) walk(p, ext, out); else if (p.endsWith(ext)) out.push(p);
  }
  return out;
};
const syntax = (code, label) => {
  const tmp = path.join(os.tmpdir(), `lint-${process.pid}-${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(tmp, code);
  const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  fs.unlinkSync(tmp);
  if (r.status !== 0) err(label, 'JS সিনট্যাক্স এরর\n    ' + r.stderr.split('\n').slice(0, 4).join('\n    '));
};

const htmlFiles = walk(ROOT, '.html'), jsFiles = walk(ROOT, '.js');

// 1) JS ফাইল ও ইনলাইন স্ক্রিপ্ট
for (const f of jsFiles) syntax(read(f), f);
for (const f of htmlFiles) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(read(f)))) if (m[1].trim()) syntax(m[1], f + ' (inline script)');
}

// 2) HTML বেসিক + লিংক + id + alt + CDN
const exists = (from, ref) => {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return true;
  return fs.existsSync(path.resolve(path.dirname(from), clean));
};
for (const f of htmlFiles) {
  const html = read(f), markup = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  if (!/^\s*<!doctype html>/i.test(html)) err(f, '<!doctype html> নেই');
  if (!/<html[^>]*\blang=/i.test(html)) err(f, '<html lang> নেই');
  if (!/<meta[^>]*name=["']viewport["']/i.test(html)) err(f, 'viewport meta নেই (মোবাইলে ভাঙবে)');
  if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(html)) err(f, '<title> খালি/নেই');
  if (!/<meta[^>]*charset/i.test(html)) err(f, 'charset meta নেই');

  const ids = {}; let m; const idRe = /\sid=["']([^"'$]+)["']/g;
  while ((m = idRe.exec(markup))) ids[m[1]] = (ids[m[1]] || 0) + 1;
  for (const [id, n] of Object.entries(ids)) if (n > 1) err(f, `ডুপ্লিকেট id="${id}" (${n} বার)`);

  const refRe = /\s(?:href|src)=["']([^"']+)["']/g;
  while ((m = refRe.exec(markup))) {
    const ref = m[1];
    if (/^(https?:|\/\/|#|mailto:|tel:|javascript:|data:|\$\{)/i.test(ref)) {
      if (/^http:\/\//i.test(ref)) err(f, `নিরাপত্তাহীন http লিংক (mixed content): ${ref}`);
      if (/@latest|\/latest\//.test(ref)) err(f, `পিন করা নয় (latest): ${ref}`);
      continue;
    }
    if (!exists(f, ref)) err(f, `ভাঙা লিংক/ফাইল: ${ref}`);
  }
  for (const [tag] of markup.matchAll(/<img\b[^>]*>/gi)) if (!/\balt=/.test(tag)) err(f, `alt ছাড়া ছবি: ${tag.slice(0, 70)}`);
}

// 3) JS টেমপ্লেটের ভেতরের লিংক ও alt
for (const f of jsFiles.filter(f => !f.includes(path.sep + 'tests' + path.sep))) {
  const js = read(f); let m;
  const linkRe = /["'`(\s=]([a-z0-9][a-z0-9-]*\.html)(?=[?"'`)#\s])/g;
  const seen = new Set();
  while ((m = linkRe.exec(js))) if (!seen.has(m[1])) { seen.add(m[1]); if (!fs.existsSync(path.join(ROOT, m[1]))) err(f, `JS এ ভাঙা পেজ লিংক: ${m[1]}`); }
  for (const [tag] of js.matchAll(/<img\b[^>]*>/gi)) if (!/\balt=/.test(tag)) err(f, `টেমপ্লেটে alt ছাড়া ছবি: ${tag.slice(0, 70)}`);
}

// 4) প্রতিটি পেজ app.js লোড করে (হেডার/ফুটার ইনজেক্ট হয়)
for (const f of htmlFiles) {
  const h = read(f);
  if (!/id=["']site-header["']/.test(h) || !/id=["']site-footer["']/.test(h)) err(f, '#site-header / #site-footer নেই');
  if (!/assets\/js\/app\.js/.test(h)) err(f, 'app.js লোড হচ্ছে না');
}

console.log(`চেক করা হয়েছে: ${htmlFiles.length}টি HTML, ${jsFiles.length}টি JS`);
if (errors.length) {
  console.error(`\n✗ ${errors.length}টি সমস্যা:\n` + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('✓ কোনো সমস্যা নেই');
