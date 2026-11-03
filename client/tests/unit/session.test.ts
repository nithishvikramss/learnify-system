import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal in-memory sessionStorage for Node
const store = new Map<string, string>();
globalThis.sessionStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => store.clear(),
  key: () => null,
  get length() { return store.size; },
} as Storage;

const { saveSession, getSession, clearSession, isAdmin } = await import('../../src/auth/session.ts');

const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

beforeEach(() => store.clear());

test('FE-AUTH-P-01 saved session is returned while valid', () => {
  saveSession({ token: 't', username: 'admin', fullName: 'Admin', role: 'ADMIN', expiresAt: inMinutes(5) });
  assert.equal(getSession()?.username, 'admin');
  assert.equal(isAdmin(getSession()), true);
});

test('FE-AUTH-N-01 expired session is cleared and treated as logged out', () => {
  saveSession({ token: 't', username: 'admin', fullName: 'Admin', role: 'ADMIN', expiresAt: inMinutes(-1) });
  assert.equal(getSession(), null);
  assert.equal(store.size, 0);
});

test('FE-AUTH-N-02 corrupted storage does not crash', () => {
  store.set('sms.session', '{not json');
  assert.equal(getSession(), null);
});

test('FE-AUTH-P-02 teacher is not admin; logout clears session', () => {
  saveSession({ token: 't', username: 'teacher', fullName: 'T', role: 'TEACHER', expiresAt: inMinutes(5) });
  assert.equal(isAdmin(getSession()), false);
  clearSession();
  assert.equal(getSession(), null);
  assert.equal(isAdmin(null), false);
});
