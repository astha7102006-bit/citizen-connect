/**
 * CitizenConnect — Auth Context (Phase 3)
 *
 * Dual-mode authentication:
 *
 * 1. REAL AUTH   — server-managed sessions via /api/auth
 *    - realUser: the authenticated DB user (or null)
 *    - login(), register(), logout() hit the real API
 *
 * 2. DEMO MODE   — localStorage role-switcher (preserved for judges/demos)
 *    - role / setRole / switchRole — existing demo functionality unchanged
 *    - isDemoMode: true — permanent flag so demo controls always appear
 *
 * Components can read both states independently.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { DEMO_ROLES, ROLE_DETAILS } from '../services/dataShaping';

const AuthContext = createContext();

// ── API helpers ────────────────────────────────────────────────────────────────
const BASE = '/api/auth';

async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send/receive session cookies
      ...options,
    });
  } catch (_networkErr) {
    const err = new Error('Unable to connect to authentication server. Please check your network connection.');
    err.code = 'NETWORK_ERROR';
    err.status = 0;
    throw err;
  }

  // Safely read response text first to handle empty bodies or non-JSON payloads
  const text = await res.text();
  let json = null;
  const contentType = res.headers.get('content-type') || '';

  if (text && (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('['))) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    let message;
    if (json?.error?.message) {
      message = json.error.message;
    } else if (res.status === 502 || res.status === 503 || res.status === 504) {
      message = 'Authentication service is temporarily unavailable. Please verify the API server is running.';
    } else if (res.status === 401) {
      message = 'Invalid email or password.';
    } else if (res.status === 400) {
      message = 'Invalid request. Please check your input.';
    } else if (res.status === 404) {
      message = 'Requested authentication endpoint was not found.';
    } else {
      message = `Authentication request failed (HTTP ${res.status}).`;
    }

    const err = new Error(message);
    err.code = json?.error?.code ?? (res.status === 502 || res.status === 504 ? 'SERVICE_UNAVAILABLE' : 'API_ERROR');
    err.status = res.status;
    throw err;
  }

  return json ?? { success: true };
}

// ── Provider ───────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // ── Real auth state ──────────────────────────────────────────────────────────
  const [realUser, setRealUser]         = useState(null);
  const [authLoading, setAuthLoading]   = useState(true); // true until /me resolves
  const [authError, setAuthError]       = useState(null);

  // Restore session on mount (page refresh)
  useEffect(() => {
    apiFetch('/me')
      .then((json) => setRealUser(json.data?.user ?? null))
      .catch(() => setRealUser(null)) // 401 is normal — user not logged in
      .finally(() => setAuthLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    const json = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setRealUser(json.data?.user ?? null);
    return json.data?.user;
  }, []);

  const register = useCallback(async ({ name, email, password, phone }) => {
    setAuthError(null);
    const json = await apiFetch('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
    setRealUser(json.data?.user ?? null);
    return json.data?.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } finally {
      setRealUser(null);
    }
  }, []);

  // ── Demo role-switcher state (PRESERVED — do not remove) ─────────────────────
  const [role, setRoleState] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roleParam = urlParams.get('role');
      if (roleParam && Object.values(DEMO_ROLES).includes(roleParam)) {
        return roleParam;
      }
      const saved = localStorage.getItem('citizenconnect_demo_role');
      if (saved && Object.values(DEMO_ROLES).includes(saved)) {
        return saved;
      }
    }
    return DEMO_ROLES.CITIZEN;
  });

  const [user, setUser] = useState(() => ROLE_DETAILS[role]);

  useEffect(() => {
    localStorage.setItem('citizenconnect_demo_role', role);
    setUser(ROLE_DETAILS[role]);
  }, [role]);

  const setRole = (newRole) => {
    if (Object.values(DEMO_ROLES).includes(newRole)) setRoleState(newRole);
  };
  const switchRole = (newRole) => setRole(newRole);

  // ── Context value ─────────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        // ── Real auth ─────────────────────────────────────────────────────────
        realUser,           // Authenticated DB user or null
        isAuthenticated: !!realUser,
        authLoading,        // true while checking session on mount
        authError,
        login,
        register,
        logout,

        // ── Demo role-switcher (unchanged) ────────────────────────────────────
        role,
        setRole,
        switchRole,
        user,
        roleDetails: ROLE_DETAILS[role] || ROLE_DETAILS[DEMO_ROLES.CITIZEN],
        allRoles: Object.values(ROLE_DETAILS),
        isCitizen:  role === DEMO_ROLES.CITIZEN,
        isOfficial: role === DEMO_ROLES.OFFICIAL,
        isReviewer: role === DEMO_ROLES.REVIEWER,
        isPublic:   role === DEMO_ROLES.PUBLIC,
        isAdmin:    role === DEMO_ROLES.ADMIN,
        isDemoMode: true, // Permanent demonstration flag — never remove
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
