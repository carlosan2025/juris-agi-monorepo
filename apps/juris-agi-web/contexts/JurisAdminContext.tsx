'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { JurisAdmin, JurisAdminSession } from '@/types/admin';

// Storage keys
const ADMIN_SESSION_KEY = 'juris_admin_session';
const ADMIN_USERS_KEY = 'juris_admin_users';

// Default admin user (first-time setup)
const DEFAULT_ADMIN: JurisAdmin = {
  id: 'admin-1',
  email: 'carlosan2009@gmail.com',
  name: 'Carlos Sanchez',
  role: 'super_admin',
  passwordSet: false,
  createdAt: new Date(),
  lastLoginAt: null,
  isActive: true,
};

interface JurisAdminContextType {
  // Session state
  isAuthenticated: boolean;
  isLoading: boolean;
  currentAdmin: JurisAdminSession | null;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresPasswordSetup?: boolean }>;
  logout: () => void;
  setPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  checkPasswordSetup: (email: string) => { exists: boolean; passwordSet: boolean };

  // Admin management
  getAllAdmins: () => JurisAdmin[];
  addAdmin: (admin: Omit<JurisAdmin, 'id' | 'createdAt' | 'lastLoginAt' | 'passwordSet' | 'isActive'>) => void;
  updateAdmin: (id: string, data: Partial<JurisAdmin>) => void;
  deleteAdmin: (id: string) => void;
}

const JurisAdminContext = createContext<JurisAdminContextType | undefined>(undefined);

// Simple hash function for demo purposes
// In production, use bcrypt on the server side
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function JurisAdminProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<JurisAdminSession | null>(null);

  // Initialize admin users and session from localStorage
  useEffect(() => {
    // Initialize default admin if not exists
    const storedAdmins = localStorage.getItem(ADMIN_USERS_KEY);
    if (!storedAdmins) {
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
    }

    // Check for existing session
    const storedSession = localStorage.getItem(ADMIN_SESSION_KEY);
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession) as JurisAdminSession;
        const expiresAt = new Date(session.expiresAt);
        if (expiresAt > new Date()) {
          setCurrentAdmin(session);
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  const getAdmins = useCallback((): JurisAdmin[] => {
    const stored = localStorage.getItem(ADMIN_USERS_KEY);
    if (stored) {
      return JSON.parse(stored).map((a: JurisAdmin) => ({
        ...a,
        createdAt: new Date(a.createdAt),
        lastLoginAt: a.lastLoginAt ? new Date(a.lastLoginAt) : null,
      }));
    }
    return [DEFAULT_ADMIN];
  }, []);

  const saveAdmins = useCallback((admins: JurisAdmin[]) => {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(admins));
  }, []);

  const checkPasswordSetup = useCallback((email: string): { exists: boolean; passwordSet: boolean } => {
    const admins = getAdmins();
    const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!admin) {
      return { exists: false, passwordSet: false };
    }
    return { exists: true, passwordSet: admin.passwordSet };
  }, [getAdmins]);

  const setPassword = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const admins = getAdmins();
    const adminIndex = admins.findIndex(a => a.email.toLowerCase() === email.toLowerCase());

    if (adminIndex === -1) {
      return { success: false, error: 'Admin user not found' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    // Update admin with password
    admins[adminIndex] = {
      ...admins[adminIndex],
      passwordSet: true,
      passwordHash: simpleHash(password),
    };

    saveAdmins(admins);

    return { success: true };
  }, [getAdmins, saveAdmins]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; requiresPasswordSetup?: boolean }> => {
    const admins = getAdmins();
    const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase() && a.isActive);

    if (!admin) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if password setup is required
    if (!admin.passwordSet) {
      return { success: false, requiresPasswordSetup: true };
    }

    // Verify password
    const hashedPassword = simpleHash(password);
    if (admin.passwordHash !== hashedPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Create session (expires in 8 hours)
    const session: JurisAdminSession = {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    };

    // Update last login
    const adminIndex = admins.findIndex(a => a.id === admin.id);
    admins[adminIndex] = {
      ...admins[adminIndex],
      lastLoginAt: new Date(),
    };
    saveAdmins(admins);

    // Save session
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    setCurrentAdmin(session);

    return { success: true };
  }, [getAdmins, saveAdmins]);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setCurrentAdmin(null);
    router.push('/administration/login');
  }, [router]);

  const getAllAdmins = useCallback(() => {
    return getAdmins();
  }, [getAdmins]);

  const addAdmin = useCallback((adminData: Omit<JurisAdmin, 'id' | 'createdAt' | 'lastLoginAt' | 'passwordSet' | 'isActive'>) => {
    const admins = getAdmins();
    const newAdmin: JurisAdmin = {
      ...adminData,
      id: `admin-${Date.now()}`,
      createdAt: new Date(),
      lastLoginAt: null,
      passwordSet: false,
      isActive: true,
    };
    admins.push(newAdmin);
    saveAdmins(admins);
  }, [getAdmins, saveAdmins]);

  const updateAdmin = useCallback((id: string, data: Partial<JurisAdmin>) => {
    const admins = getAdmins();
    const index = admins.findIndex(a => a.id === id);
    if (index !== -1) {
      admins[index] = { ...admins[index], ...data };
      saveAdmins(admins);
    }
  }, [getAdmins, saveAdmins]);

  const deleteAdmin = useCallback((id: string) => {
    const admins = getAdmins();
    const filtered = admins.filter(a => a.id !== id);
    saveAdmins(filtered);
  }, [getAdmins, saveAdmins]);

  return (
    <JurisAdminContext.Provider
      value={{
        isAuthenticated: !!currentAdmin,
        isLoading,
        currentAdmin,
        login,
        logout,
        setPassword,
        checkPasswordSetup,
        getAllAdmins,
        addAdmin,
        updateAdmin,
        deleteAdmin,
      }}
    >
      {children}
    </JurisAdminContext.Provider>
  );
}

export function useJurisAdmin() {
  const context = useContext(JurisAdminContext);
  if (context === undefined) {
    throw new Error('useJurisAdmin must be used within a JurisAdminProvider');
  }
  return context;
}
