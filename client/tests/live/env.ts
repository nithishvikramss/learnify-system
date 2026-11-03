import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** Reads server/.env so live tests use the real seeded accounts without hard-coding passwords. */
function loadServerEnv(): Record<string, string> {
  const path = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'server', '.env');
  const env: Record<string, string> = {};
  for (const raw of readFileSync(path, 'utf-8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    env[line.slice(0, i)] = line.slice(i + 1);
  }
  return env;
}

const env = loadServerEnv();

export const ADMIN = { username: env.APP_ADMIN_USERNAME || 'admin', password: env.APP_ADMIN_PASSWORD ?? '' };
export const TEACHER = { username: env.APP_TEACHER_USERNAME || 'teacher', password: env.APP_TEACHER_PASSWORD ?? '' };
