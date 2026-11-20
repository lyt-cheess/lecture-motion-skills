import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const port = Number(process.argv[2] ?? 8080);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('端口应为 0–65535。');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/') {
      res.writeHead(302, { Location: '/template/index.html' }).end();
      return;
    }
    const sibling = pathname.split('/')[1];
    const shared = sibling === 'xixi-motion' || sibling === 'voice-sync';
    const directory = shared ? resolve(root, '..', sibling) : root;
    const mounted = shared || sibling === 'lecture-motion';
    const relative = mounted ? pathname.slice(sibling.length + 1) : pathname;
    const file = resolve(directory, '.' + relative);
    const type = types[extname(file)];
    if (!file.startsWith(resolve(directory) + sep) || !type || !(await stat(file)).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader('Content-Type', type);
    const stream = createReadStream(file);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch {
    res.writeHead(404).end();
  }
});
server.listen(port, '127.0.0.1', () => {
  console.log('课程模板 http://127.0.0.1:' + server.address().port + '/template/index.html');
  console.log('核心动效库 http://127.0.0.1:' + server.address().port + '/motion/gallery.html');
});
