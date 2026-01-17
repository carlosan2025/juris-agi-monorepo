'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import type {
  NavigationLevel,
  Company,
  CompanyUser,
  EnhancedPortfolio,
  Mandate,
  Case,
  IndustryProfile,
} from '@/types/domain';

// =============================================================================
// Helper: Get industry-specific labels
// =============================================================================

export function getPortfolioLabel(industry: IndustryProfile | undefined, plural: boolean = false): string {
  switch (industry) {
    case 'vc':
      return plural ? 'Funds' : 'Fund';
    case 'insurance':
      return plural ? 'Books' : 'Book';
    case 'pharma':
      return plural ? 'Pipelines' : 'Pipeline';
    default:
      return plural ? 'Portfolios' : 'Portfolio';
  }
}

export function getCaseLabel(industry: IndustryProfile | undefined, plural: boolean = false): string {
  switch (industry) {
    case 'vc':
      return plural ? 'Deals' : 'Deal';
    case 'insurance':
      return plural ? 'Underwritings' : 'Underwriting';
    case 'pharma':
      return plural ? 'Assessments' : 'Assessment';
    default:
      return plural ? 'Cases' : 'Case';
  }
}

export function getMandateLabel(industry: IndustryProfile | undefined, plural: boolean = false): string {
  switch (industry) {
    case 'vc':
      return plural ? 'Investment Mandates' : 'Investment Mandate';
    case 'insurance':
      return plural ? 'Underwriting Mandates' : 'Underwriting Mandate';
    case 'pharma':
      return plural ? 'Evaluation Mandates' : 'Evaluation Mandate';
    default:
      return plural ? 'Mandates' : 'Mandate';
  }
}

// =============================================================================
// Context Types
// =============================================================================

interface NavigationState {
  level: NavigationLevel;
  company: Company | null;
  currentUser: CompanyUser | null;
  selectedPortfolio: EnhancedPortfolio | null;
  selectedMandate: Mandate | null;
  selectedCase: Case | null;
  portfolios: EnhancedPortfolio[];
  isFirstTimeSetup: boolean;
}

interface NavigationContextType extends NavigationState {
  // Navigation actions
  navigateToCompany: () => void;
  navigateToPortfolio: (portfolio: EnhancedPortfolio) => void;
  navigateToMandate: (mandate: Mandate) => void;
  navigateToCase: (caseItem: Case) => void;

  // Permission checks
  isAdmin: () => boolean;
  isOwner: () => boolean;
  canAccessCompanySettings: () => boolean;
  canManageUsers: () => boolean;
  canAccessBilling: () => boolean;
  hasPortfolioAccess: (portfolioId: string) => boolean;
  getPortfolioAccessLevel: (portfolioId: string) => 'maker' | 'checker' | null;

  // Industry-specific labels
  getPortfolioLabel: (plural?: boolean) => string;
  getCaseLabel: (plural?: boolean) => string;
  getMandateLabel: (plural?: boolean) => string;

  // Setup actions
  completeSetup: (companyData: { companyName: string; industryProfile: IndustryProfile }) => Promise<void>;
  updateCompany: (data: Partial<Company>) => Promise<void>;

  // Portfolio management
  addPortfolio: (portfolio: EnhancedPortfolio) => void;
  refreshPortfolios: () => Promise<void>;

  // Get all company users (for assignment)
  getCompanyUsers: () => CompanyUser[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  // Track if portfolios have been fetched to avoid refetching
  const [portfoliosLoaded, setPortfoliosLoaded] = useState(false);

  // Initialize with empty/null state - will be populated from auth or setup
  const [state, setState] = useState<NavigationState>({
    level: 'company',
    company: null,
    currentUser: null,
    selectedPortfolio: null,
    selectedMandate: null,
    selectedCase: null,
    portfolios: [], // Start with no portfolios
    isFirstTimeSetup: true,
  });

  // Map database industry profile to frontend type
  function mapIndustryProfile(dbProfile: string | undefined): IndustryProfile {
    switch (dbProfile) {
      case 'VENTURE_CAPITAL':
        return 'vc';
      case 'INSURANCE':
        return 'insurance';
      case 'PHARMA':
        return 'pharma';
      default:
        return 'vc'; // Default to VC if not set
    }
  }

  // Map frontend industry profile to database enum
  function mapToDbIndustryProfile(profile: IndustryProfile): string {
    switch (profile) {
      case 'vc':
        return 'VENTURE_CAPITAL';
      case 'insurance':
        return 'INSURANCE';
      case 'pharma':
        return 'PHARMA';
      default:
        return 'GENERIC';
    }
  }

  // Map database company role to frontend role
  function mapCompanyRole(dbRole: string | undefined): 'owner' | 'admin' | 'member' {
    switch (dbRole) {
      case 'OWNER':
        return 'owner';
      case 'ORG_ADMIN':
      case 'MANDATE_ADMIN':
        return 'admin';
      default:
        return 'member';
    }
  }

  // Fetch company details including logo
  const fetchCompanyDetails = useCallback(async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setState((prev) => ({
            ...prev,
            company: prev.company
              ? {
                  ...prev.company,
                  logoUrl: data.company.logoUrl || undefined,
                }
              : null,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch company details:', error);
    }
  }, []);

  // Sync company/user data from auth context
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use real company data from auth session
      const hasCompany = !!user.companyId;
      const industryProfile = mapIndustryProfile(user.industryProfile);
      const isSetupComplete = user.industryProfile && user.industryProfile !== 'GENERIC';

      setState((prev) => ({
        ...prev,
        company: hasCompany
          ? {
              id: user.companyId!,
              name: user.companyName || 'My Company',
              industryProfile,
              settings: {
                defaultContextSize: 'medium',
                defaultClaimDensity: 'medium',
                defaultPrecisionRecall: 'balanced',
                dslStrictness: 'moderate',
                requireApprovalForActivation: true,
                autoCreateDraftBaseline: true,
                auditRetentionDays: 365 * 7,
                features: {
                  caselaw: true,
                  monitoring: true,
                  portfolioIntegration: true,
                  advancedReporting: true,
                },
              },
              setupComplete: !!isSetupComplete,
              createdAt: new Date(),
              createdBy: user.id,
            }
          : null,
        currentUser: {
          id: user.id,
          email: user.email,
          name: user.name,
          companyId: user.companyId || '',
          role: mapCompanyRole(user.companyRole),
          portfolioAccess: [],
          inviteStatus: 'accepted',
          invitedAt: new Date(),
          invitedBy: null,
          acceptedAt: new Date(),
          lastActiveAt: new Date(),
          createdAt: new Date(),
        },
        isFirstTimeSetup: !isSetupComplete,
        // Don't reset portfolios here - they will be fetched by the portfolio effect
      }));

      // Fetch additional company details (like logo)
      if (hasCompany && user.companyId) {
        fetchCompanyDetails(user.companyId);
      }
    }
  }, [isAuthenticated, user, fetchCompanyDetails]);

  // Navigation actions
  const navigateToCompany = useCallback(() => {
    setState((prev) => ({
      ...prev,
      level: 'company',
      selectedPortfolio: null,
      selectedMandate: null,
      selectedCase: null,
    }));
  }, []);

  const navigateToPortfolio = useCallback((portfolio: EnhancedPortfolio) => {
    setState((prev) => ({
      ...prev,
      level: 'portfolio',
      selectedPortfolio: portfolio,
      selectedMandate: null,
      selectedCase: null,
    }));
  }, []);

  const navigateToMandate = useCallback((mandate: Mandate) => {
    setState((prev) => ({
      ...prev,
      level: 'mandate',
      selectedMandate: mandate,
      selectedCase: null,
    }));
  }, []);

  const navigateToCase = useCallback((caseItem: Case) => {
    setState((prev) => ({
      ...prev,
      level: 'case',
      selectedCase: caseItem,
    }));
  }, []);

  // Permission checks
  const isOwner = useCallback(() => {
    return state.currentUser?.role === 'owner';
  }, [state.currentUser]);

  const isAdmin = useCallback(() => {
    return state.currentUser?.role === 'owner' || state.currentUser?.role === 'admin';
  }, [state.currentUser]);

  const canAccessCompanySettings = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  const canManageUsers = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  const canAccessBilling = useCallback(() => {
    return isOwner();
  }, [isOwner]);

  const hasPortfolioAccess = useCallback(
    (portfolioId: string) => {
      // Check if the portfolio exists in the state (API already filters by permissions)
      // If a portfolio is in the list, the user has access to it
      const portfolio = state.portfolios.find((p) => p.id === portfolioId);
      if (!portfolio) return false;
      // If the portfolio is in the list, the user has some level of access
      return true;
    },
    [state.portfolios]
  );

  const getPortfolioAccessLevel = useCallback(
    (portfolioId: string): 'maker' | 'checker' | null => {
      // Look up the portfolio and use the userAccessLevel returned from the API
      const portfolio = state.portfolios.find((p) => p.id === portfolioId);
      if (!portfolio) return null;

      // Map the API's access level to the UI's expected values
      const level = portfolio.userAccessLevel;
      if (level === 'ADMIN' || level === 'CHECKER') return 'checker';
      if (level === 'MAKER') return 'maker';
      if (level === 'VIEWER') return 'maker'; // Viewers can see but mapped to maker for display
      return null;
    },
    [state.portfolios]
  );

  // Industry-specific label helpers
  const getPortfolioLabelFn = useCallback(
    (plural: boolean = false) => {
      return getPortfolioLabel(state.company?.industryProfile, plural);
    },
    [state.company?.industryProfile]
  );

  const getCaseLabelFn = useCallback(
    (plural: boolean = false) => {
      return getCaseLabel(state.company?.industryProfile, plural);
    },
    [state.company?.industryProfile]
  );

  const getMandateLabelFn = useCallback(
    (plural: boolean = false) => {
      return getMandateLabel(state.company?.industryProfile, plural);
    },
    [state.company?.industryProfile]
  );

  // Setup actions - updates or creates company in database
  const completeSetup = useCallback(
    async (companyData: { companyName: string; industryProfile: IndustryProfile }) => {
      // Map frontend industry profile to database enum
      const dbIndustryProfile = mapToDbIndustryProfile(companyData.industryProfile);

      try {
        // Use the setup API which handles both creating and updating companies
        const response = await fetch('/api/companies/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: companyData.companyName,
            industryProfile: dbIndustryProfile,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to setup company:', errorData);
          throw new Error(errorData.error || 'Failed to setup company');
        }

        const data = await response.json();

        // Update local state with the returned company data
        setState((prev) => ({
          ...prev,
          isFirstTimeSetup: false,
          company: {
            id: data.company.id,
            name: data.company.name,
            industryProfile: companyData.industryProfile,
            settings: prev.company?.settings || {
              defaultContextSize: 'medium',
              defaultClaimDensity: 'medium',
              defaultPrecisionRecall: 'balanced',
              dslStrictness: 'moderate',
              requireApprovalForActivation: true,
              autoCreateDraftBaseline: true,
              auditRetentionDays: 365 * 7,
              features: {
                caselaw: true,
                monitoring: true,
                portfolioIntegration: true,
                advancedReporting: true,
              },
            },
            setupComplete: true,
            createdAt: prev.company?.createdAt || new Date(),
            createdBy: prev.company?.createdBy || '',
          },
          // Update currentUser's companyId if it was just created
          currentUser: prev.currentUser
            ? {
                ...prev.currentUser,
                companyId: data.company.id,
              }
            : null,
        }));
      } catch (error) {
        console.error('Failed to complete setup:', error);
        throw error;
      }
    },
    []
  );

  const updateCompany = useCallback(async (data: Partial<Company>) => {
    if (!state.company?.id) return;

    // Prepare data for API
    const apiData: Record<string, unknown> = {};
    if (data.name) apiData.name = data.name;
    if (data.industryProfile) apiData.industryProfile = mapToDbIndustryProfile(data.industryProfile);

    try {
      const response = await fetch(`/api/companies/${state.company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          company: prev.company ? { ...prev.company, ...data } : null,
        }));
      }
    } catch (error) {
      console.error('Failed to update company:', error);
    }
  }, [state.company?.id]);

  // Add a new portfolio to the list
  const addPortfolio = useCallback((portfolio: EnhancedPortfolio) => {
    setState((prev) => ({
      ...prev,
      portfolios: [...prev.portfolios, portfolio],
    }));
  }, []);

  // Fetch portfolios from API
  const refreshPortfolios = useCallback(async () => {
    if (!state.company?.id) return;

    try {
      const response = await fetch(`/api/portfolios?companyId=${state.company.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.portfolios) {
          // Transform API response to match EnhancedPortfolio type
          const portfolios: EnhancedPortfolio[] = data.portfolios.map((p: Record<string, unknown>) => ({
            ...p,
            // Explicitly include userAccessLevel from API response
            userAccessLevel: p.userAccessLevel as EnhancedPortfolio['userAccessLevel'],
            metrics: {
              ...(p.metrics as Record<string, unknown>),
              lastCalculatedAt: new Date((p.metrics as Record<string, unknown>)?.lastCalculatedAt as string || new Date()),
            },
            createdAt: new Date(p.createdAt as string),
            updatedAt: new Date(p.updatedAt as string),
          }));
          setState((prev) => ({
            ...prev,
            portfolios,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    }
  }, [state.company?.id]);

  // Fetch portfolios when company is set
  useEffect(() => {
    if (state.company?.id && !state.isFirstTimeSetup && !portfoliosLoaded) {
      setPortfoliosLoaded(true);
      refreshPortfolios();
    }
  }, [state.company?.id, state.isFirstTimeSetup, portfoliosLoaded, refreshPortfolios]);

  // Get all company users (for assignment during portfolio creation)
  // backend_pending: In production, this would fetch from API
  const getCompanyUsers = useCallback((): CompanyUser[] => {
    // For now, return just the current user
    // In production, this would return all company users from an API call
    if (state.currentUser) {
      return [state.currentUser];
    }
    return [];
  }, [state.currentUser]);

  return (
    <NavigationContext.Provider
      value={{
        ...state,
        navigateToCompany,
        navigateToPortfolio,
        navigateToMandate,
        navigateToCase,
        isAdmin,
        isOwner,
        canAccessCompanySettings,
        canManageUsers,
        canAccessBilling,
        hasPortfolioAccess,
        getPortfolioAccessLevel,
        getPortfolioLabel: getPortfolioLabelFn,
        getCaseLabel: getCaseLabelFn,
        getMandateLabel: getMandateLabelFn,
        completeSetup,
        updateCompany,
        addPortfolio,
        refreshPortfolios,
        getCompanyUsers,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
