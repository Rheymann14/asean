import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const args = process.argv.slice(2).join(' ');

rmSync('resources/js/routes', { recursive: true, force: true });
rmSync('resources/js/actions', { recursive: true, force: true });
rmSync('resources/js/wayfinder', { recursive: true, force: true });

execSync(`php artisan wayfinder:generate ${args}`, { stdio: 'inherit' });
