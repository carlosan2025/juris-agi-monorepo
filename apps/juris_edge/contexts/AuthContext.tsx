'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  companyId?: string;
  companyName?: string;
  companyRole?: 'OWNER' | 'ORG_ADMIN' | 'MANDATE_ADMIN' | 'MEMBER' | 'COMPLIANCE' | 'RISK' | 'FINANCE' | 'IC_MEMBER' | 'IC_CHAIR' | 'VIEWER';
  industryProfile?: 'VENTURE_CAPITAL' | 'INSURANCE' | 'PHARMA' | 'GENERIC';
  companySetupComplete?: boolean;
  image?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  company: string;
  password: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (data: RegisterData) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  setCompanySetupComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/invite'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isNewUser, setIsNewUser] = useState(false);

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  const user: User | null = session?.user
    ? {
        id: (session.user as any).id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        companyId: (session.user as any).companyId,
        companyName: (session.user as any).companyName,
        companyRole: (session.user as any).companyRole,
        industryProfile: (session.user as any).industryProfile,
        companySetupComplete: (session.user as any).industryProfile !== 'GENERIC', // Setup complete if industry is set
        image: session.user.image || undefined,
      }
    : null;

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    // Check if we're on company routes
    const isCompanyRoute = pathname.startsWith('/company');

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    } else if (isAuthenticated && isPublicRoute && !pathname.startsWith('/invite')) {
      // For newly registered users or users without complete setup, go to setup
      // Otherwise go to company dashboard
      if (isNewUser || (user && !user.companySetupComplete)) {
        router.push('/company/setup');
      } else {
        router.push('/company');
      }
    }
  }, [isLoading, isAuthenticated, pathname, router, isNewUser, user]);

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { error: 'Invalid email or password' };
      }

      setIsNewUser(false);
      return {};
    } catch (error) {
      return { error: 'An error occurred during login' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Registration failed' };
      }

      // Mark as new user for proper redirect
      setIsNewUser(true);

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        return { error: 'Registration successful but login failed. Please try logging in.' };
      }

      return {};
    } catch (error) {
      return { error: 'An error occurred during registration' };
    }
  };

  const logout = async () => {
    setIsNewUser(false);
    await signOut({ redirect: false });
    router.push('/login');
  };

  const setCompanySetupComplete = () => {
    setIsNewUser(false);
    // backend_pending: Update user's companySetupComplete flag in database
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isNewUser,
        login,
        register,
        logout,
        setCompanySetupComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
