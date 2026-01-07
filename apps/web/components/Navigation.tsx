'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useUserContext } from '../contexts/UserContext';

export default function Navigation() {
  const pathname = usePathname();
  const { userProfile, isLoading, isFounder, isInvestor } = useUserContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Define navigation items based on user role
  const founderNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/validate', label: 'New Validation', icon: '🚀' },
    { href: '/founder/interests', label: 'Investor Interest', icon: '💰' },
  ];

  const investorNavItems = [
    { href: '/investor', label: 'Browse Deals', icon: '🔍' },
    { href: '/investor/saved', label: 'Saved Deals', icon: '⭐' },
    { href: '/investor/meetings', label: 'Meetings', icon: '📅' },
  ];

  const navItems = isInvestor ? investorNavItems : founderNavItems;

  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <span className="text-emerald-400">Validation</span>
            <span className="text-white">Council</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <SignedIn>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.href)
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Role switcher hint */}
              {isFounder && (
                <Link
                  href="/investor"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 transition-colors ml-2"
                >
                  <span>💰</span>
                  <span>Investor View</span>
                </Link>
              )}
              {isInvestor && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors ml-2"
                >
                  <span>🚀</span>
                  <span>Founder View</span>
                </Link>
              )}
            </SignedIn>
          </nav>

          {/* Right side: User/Auth */}
          <div className="flex items-center gap-4">
            <SignedIn>
              {/* Plan badge */}
              {userProfile?.subscription?.plan && userProfile.subscription.plan !== 'FREE' && (
                <span className="hidden md:inline-flex px-2 py-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full text-xs text-purple-300">
                  {userProfile.subscription.plan}
                </span>
              )}

              {/* User type badge */}
              <span className={`hidden md:inline-flex px-2 py-1 rounded-full text-xs ${
                isInvestor
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isInvestor ? '💰 Investor' : '🚀 Founder'}
              </span>

              <Link
                href="/pricing"
                className="hidden md:block text-slate-400 hover:text-white text-sm transition-colors"
              >
                Upgrade
              </Link>

              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <Link
                href="/sign-in"
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </SignedOut>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700">
            <SignedIn>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                      isActive(item.href)
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}

                <div className="border-t border-slate-700 my-2 pt-2">
                  {isFounder && (
                    <Link
                      href="/investor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-purple-400 hover:bg-purple-900/20"
                    >
                      <span className="text-xl">💰</span>
                      <span>Switch to Investor View</span>
                    </Link>
                  )}
                  {isInvestor && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-emerald-400 hover:bg-emerald-900/20"
                    >
                      <span className="text-xl">🚀</span>
                      <span>Switch to Founder View</span>
                    </Link>
                  )}
                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <span className="text-xl">✨</span>
                    <span>Upgrade Plan</span>
                  </Link>
                </div>
              </div>
            </SignedIn>
          </div>
        )}
      </div>
    </header>
  );
}
