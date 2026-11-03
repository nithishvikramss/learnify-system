export type Role = 'ADMIN' | 'TEACHER';

export interface Session {
  token: string;
  username: string;
  fullName: string;
  role: Role;
  expiresAt: string; // ISO timestamp from the server
}

// sessionStorage: cleared when the browser tab closes, so a shared lab PC does not stay logged in.
const KEY = 'sms.session';

export function saveSession(session: Session) {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

/** Returns the current session, or null if not logged in or the token has expired. */
export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session.token || new Date(session.expiresAt).getTime() <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}

export const isAdmin = (session: Session | null) => session?.role === 'ADMIN';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  TEACHER: 'Teacher',
};
