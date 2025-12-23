'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  BarChart3,
  FileText,
  Target,
  Brain,
  Settings,
  LogOut,
  Activity,
  Menu,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/content/library', label: 'Content', icon: FileText },
  { href: '/campaigns', label: 'Campaigns', icon: Target },
  { href: '/nlp', label: 'AI Features', icon: Brain },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function TopNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-0.2 mr-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-500 to-primary-500 shadow-lg shadow-secondary-500/30">
            <Activity className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold text-white">
            <span className="bg-gradient-to-r from-secondary-300 to-primary-300 bg-clip-text text-transparent">
              Metric
            </span>
            Pulse
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-between xl:flex" aria-label="Main navigation">
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-500/10 text-primary-200 border border-primary-400/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-white/70">
              {user ? (
                <span>
                  {user.first_name} {user.last_name}
                </span>
              ) : (
                <span>Guest</span>
              )}
            </div>
            {/* Only show logout button if user is logged in */}
            {user && (
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:border-red-400/60 hover:text-red-200 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </nav>

        {/* Mobile menu button - shows when desktop nav is hidden, positioned on the right */}
        <button
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            // Trigger MobileNav menu via custom event
            window.dispatchEvent(new CustomEvent('toggleMobileMenu', { detail: !mobileMenuOpen }));
          }}
          className="xl:hidden text-white/80 hover:text-white p-2 transition-colors ml-auto"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}


