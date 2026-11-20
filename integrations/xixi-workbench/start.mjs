import { spawn } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const [directory, ...flags] = process.argv.slice(2);
if (!directory || directory.startsWith('-')) {
  console.error('用法：node integrations/xixi-workbench/start.mjs <解压后的 xixi-workbench 目录> [--check | --open]');
  process.exit(2);
}
const root = isAbsolute(directory) ? directory : resolve(directory);
const launcher = resolve(root, 'scripts/start.mjs');
const runtime = resolve(root, 'runtime/console/scripts/serve-workbench.mjs');
if (!existsSync(launcher) || !existsSync(runtime)) {
  console.error('请选择完整解压的 xixi-workbench 目录。');
  process.exit(2);
}

const child = spawn(process.execPath, [launcher, ...flags], { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => child.kill(signal));
}
child.once('error', error => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
