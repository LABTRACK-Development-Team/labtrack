import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthContextType {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: any, token?: string) => void;
  setSession: (user: any, token?: string) => void;
    updateUser: (user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawUser = sessionStorage.getItem("labtrack_user") || localStorage.getItem("labtrack_user");
      const rawToken = sessionStorage.getItem("labtrack_token") || localStorage.getItem("labtrack_token");
      if (rawUser) setUser(JSON.parse(rawUser));
      if (rawToken) setToken(rawToken);
    } catch (e) {}
  }, []);

  const setSession = (u: any, t?: string) => {
    setUser(u);
    if (t) setToken(t);
    sessionStorage.setItem("labtrack_user", JSON.stringify(u));
    if (t) sessionStorage.setItem("labtrack_token", t);
  };

  const login = (u: any, t?: string) => {
    setSession(u, t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("labtrack_user");
    sessionStorage.removeItem("labtrack_token");
    localStorage.removeItem("labtrack_user");
    localStorage.removeItem("labtrack_token");
  };

  
  const updateUser = (u: any) => {
    setUser(u);
    sessionStorage.setItem("labtrack_user", JSON.stringify(u));
  };
return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token || !!user, login, setSession, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const useAuthContext = useAuth;

export default AuthContext;