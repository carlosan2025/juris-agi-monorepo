// Juris Admin Types - Platform Administration

export interface JurisAdmin {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'support';
  passwordSet: boolean;
  passwordHash?: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  isActive: boolean;
}

export interface JurisAdminSession {
  adminId: string;
  email: string;
  name: string;
  role: JurisAdmin['role'];
  expiresAt: Date;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminSetPasswordData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

// Platform-wide statistics
export interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalPortfolios: number;
  totalCases: number;
  emailsSent: number;
  storageUsedGB: number;
}

// Email configuration for admin panel
export interface EmailConfiguration {
  provider: 'gmail' | 'sendgrid' | 'mailgun' | 'custom';
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromEmail: string;
  fromName: string;
  isConfigured: boolean;
  lastTestAt: Date | null;
  lastTestStatus: 'success' | 'failed' | null;
}

// System health status
export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  email: 'healthy' | 'degraded' | 'down' | 'not_configured';
  storage: 'healthy' | 'degraded' | 'down';
  ai: 'healthy' | 'degraded' | 'down' | 'not_configured';
  lastCheckedAt: Date;
}
