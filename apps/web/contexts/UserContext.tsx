'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { API_URL } from '../lib/config';

export type UserType = 'FOUNDER' | 'INVESTOR' | 'ADMIN';
export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  company: string | null;
  linkedInUrl: string | null;
  userType: UserType;
  isVerified: boolean;
  credits: number;
  subscription: {
    plan: SubscriptionPlan;
    status: string;
    validationsUsed: number;
  } | null;
  founderProfile?: {
    bio: string | null;
    openToInvestors: boolean;
  } | null;
  investorProfile?: {
    firmName: string | null;
    firmType: string;
    checkSizeMin: number;
    checkSizeMax: number;
    stages: string[];
    industries: string[];
  } | null;
}

interface UserContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  isFounder: boolean;
  isInvestor: boolean;
  isAdmin: boolean;
  canCreateValidation: boolean;
  canBrowseDeals: boolean;
  canContactFounders: boolean;
  canGoPublic: boolean;
  needsOnboarding: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Routes that don't require onboarding check
const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/onboarding', '/pricing'];

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchUserProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);

        // Check if user needs onboarding (no userType set or hasn't completed profile)
        // For now, we check if userType is the default FOUNDER with no profile
        const hasNoProfile = !data.founderProfile && !data.investorProfile;
        setNeedsOnboarding(hasNoProfile && data.userType === 'FOUNDER');
      } else if (response.status === 404) {
        // User doesn't exist in our DB yet - needs onboarding
        setNeedsOnboarding(true);
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to fetch user profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clerkLoaded) {
      fetchUserProfile();
    }
  }, [clerkLoaded, user]);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (!isLoading && needsOnboarding && user && !PUBLIC_ROUTES.some(r => pathname?.startsWith(r))) {
      // User needs onboarding and is trying to access a protected route
      router.push('/onboarding');
    }
  }, [isLoading, needsOnboarding, pathname, user]);

  const refreshProfile = async () => {
    setIsLoading(true);
    await fetchUserProfile();
  };

  // Feature flags based on user type and subscription
  const isFounder = userProfile?.userType === 'FOUNDER';
  const isInvestor = userProfile?.userType === 'INVESTOR';
  const isAdmin = userProfile?.userType === 'ADMIN';

  const plan = userProfile?.subscription?.plan || 'FREE';
  const isPaidFounder = isFounder && (plan === 'STARTER' || plan === 'PROFESSIONAL' || plan === 'ENTERPRISE');
  const isPaidInvestor = isInvestor && (plan === 'STARTER' || plan === 'PROFESSIONAL' || plan === 'ENTERPRISE');

  // Feature permissions
  const canCreateValidation = isFounder || isAdmin;
  const canBrowseDeals = isInvestor || isAdmin;
  const canContactFounders = isPaidInvestor || isAdmin;
  const canGoPublic = isPaidFounder || isAdmin;

  return (
    <UserContext.Provider
      value={{
        userProfile,
        isLoading,
        error,
        refreshProfile,
        isFounder,
        isInvestor,
        isAdmin,
        canCreateValidation,
        canBrowseDeals,
        canContactFounders,
        canGoPublic,
        needsOnboarding,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
