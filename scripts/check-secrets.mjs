import { execFileSync } from 'node:child_process';
const paths = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
let failed = false;
for (const path of paths) {
  const content = execFileSync('git', ['show', ':' + path], { encoding: 'utf8', maxBuffer: 20000000 });
  if (/(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}/.test(content)) {
    console.error(`Posible credencial en ${path}. Retírala antes de confirmar el commit.`);
    failed = true;
  }
}
if (failed) process.exit(1);
