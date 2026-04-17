import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const nodeCommand = process.execPath;
const childOptions = {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
};

let isShuttingDown = false;

const startProcess = (name, args) => {
  const child = spawn(nodeCommand, args, childOptions);

  child.on('error', (error) => {
    console.error(`[${name}] Không thể khởi động: ${error.message}`);
    stopAll();
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (isShuttingDown || signal === 'SIGTERM' || signal === 'SIGINT') return;

    if (code && code !== 0) {
      console.error(`[${name}] Đã dừng với mã lỗi ${code}.`);
      stopAll();
      process.exit(code);
    }
  });

  return child;
};

const processes = [
  startProcess('api', [path.join(rootDir, 'server/index.js')]),
  startProcess('web', [path.join(rootDir, 'node_modules/vite/bin/vite.js')]),
];

const stopAll = () => {
  isShuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
};

process.on('SIGINT', () => {
  stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAll();
  process.exit(0);
});
