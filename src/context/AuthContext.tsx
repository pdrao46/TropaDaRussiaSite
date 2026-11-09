import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AUTH_MESSAGES, consumeAuthErrorFromUrl, isAuthConfigured, fetchSession, logout as logoutRequest, startDiscordLogin } from '../services/authService';
import type { AuthState, SessionResult } from '../types/auth';

export interface AuthContextValue extends AuthState {
  /** Interface de login (modal) aberta. */
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  /** Inicia o OAuth2 real (só age quando o backend estiver habilitado). */
  login: () => void;
  /** Encerra a sessão no backend. */
  logout: () => Promise<void>;
  /** Revalida a sessão (`GET /api/auth/me`). */
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function fromSession(result: SessionResult): AuthState {
  switch (result.kind) {
    case 'authenticated':
      return { status: 'authenticated', user: result.user };
    case 'unauthenticated':
      return { status: 'unauthenticated', user: null };
    case 'expired':
      return { status: 'expired', user: null, message: AUTH_MESSAGES.expired };
    case 'unavailable':
      return {
        status: 'unavailable',
        user: null,
        unavailableReason: result.reason,
        message: result.reason === 'not_configured' ? AUTH_MESSAGES.notConfigured : AUTH_MESSAGES.offline,
      };
    case 'error':
      return { status: 'error', user: null, message: result.message };
  }
}

/**
 * Estado de autenticação. Os dados do usuário vêm EXCLUSIVAMENTE de `GET /api/auth/me`
 * (sessão em cookie HttpOnly). Nada é persistido no navegador.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Sem backend configurado, o estado inicial já é "indisponível" (nenhuma requisição é feita).
  const [state, setState] = useState<AuthState>(() =>
    isAuthConfigured() ? { status: 'checking', user: null } : fromSession({ kind: 'unavailable', reason: 'not_configured' }),
  );
  const [isLoginOpen, setLoginOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setState((s) => (s.status === 'authenticated' ? s : { status: 'checking', user: null }));
    try {
      const result = await fetchSession(ac.signal);
      if (!ac.signal.aborted) setState(fromSession(result));
    } catch {
      /* requisição cancelada */
    }
  }, []);

  useEffect(() => {
    const callbackError = consumeAuthErrorFromUrl();
    if (callbackError) {
      setState(
        callbackError.code === 'session_expired'
          ? { status: 'expired', user: null, message: callbackError.message }
          : { status: 'error', user: null, message: callbackError.message },
      );
      setLoginOpen(true);
    } else if (isAuthConfigured()) {
      void refresh();
    }
    // Voltou do Discord pelo botão "voltar" (bfcache): revalida para não ficar preso em "conectando".
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted && isAuthConfigured()) void refresh();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => {
      controller.current?.abort();
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [refresh]);

  const login = useCallback(() => {
    if (state.status === 'unavailable' && state.unavailableReason === 'not_configured') return;
    setState({ status: 'connecting', user: null });
    startDiscordLogin();
  }, [state.status, state.unavailableReason]);

  const logout = useCallback(async () => {
    await logoutRequest();
    setState({ status: 'unauthenticated', user: null });
  }, []);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, isLoginOpen, openLogin, closeLogin, login, logout, refresh }),
    [state, isLoginOpen, openLogin, closeLogin, login, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
