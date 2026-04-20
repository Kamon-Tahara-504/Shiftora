"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredAuthTokens,
  setStoredAuthTokens,
  unauthorizedEventName,
} from "@/lib/api";
import { fetchMe, login as loginRequest, logout as logoutRequest } from "@/services/authService";

export type AuthUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  organization_id: string | null;
  role: "org_admin" | "staff" | null;
  system_role: string | null;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const me = await fetchMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<AuthUser> => {
    const tokens = await loginRequest(input);
    setStoredAuthTokens(tokens);
    const me = await fetchMe();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest();
    } catch {
      // noop: local session cleanup is the source of truth on frontend.
    } finally {
      clearStoredAuthTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function bootstrapAuth() {
      const me = await refreshMe();
      if (mounted && !me) {
        clearStoredAuthTokens();
      }
      if (mounted) {
        setIsLoading(false);
      }
    }
    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, [refreshMe]);

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredAuthTokens();
      setUser(null);
    }
    window.addEventListener(unauthorizedEventName(), handleUnauthorized);
    return () => {
      window.removeEventListener(unauthorizedEventName(), handleUnauthorized);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refreshMe,
    }),
    [isLoading, login, logout, refreshMe, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
