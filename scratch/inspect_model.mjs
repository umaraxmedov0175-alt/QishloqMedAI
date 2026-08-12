import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'public', 'models');
const files = fs.readdirSync(dir);

for (const file of files) {
  const filePath = path.join(dir, file);
  const stat = fs.statSync(filePath);
  const buf = fs.readFileSync(filePath);
  const isGlb = buf.slice(0, 4).toString('utf8') === 'glTF';
  const header = buf.slice(0, 50).toString('utf8').replace(/\r?\n/g, ' ');
  console.log(`File: ${file} | Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB | isGLB: ${isGlb} | Header: "${header}"`);
}
