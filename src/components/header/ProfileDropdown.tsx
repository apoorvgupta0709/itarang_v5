"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { User, Settings, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function ProfileDropdown() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    if (!user) return null;

    // Get initials for avatar fallback
    const initials = user.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 shadow-sm"
            >
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                    {initials}
                </div>
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-700 leading-tight">{user.name || 'User'}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{user.role || 'Role'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 transform origin-top-right transition-all">
                    {/* User Info Header in Dropdown */}
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>

                        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-fit">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Active Subscription
                        </div>
                    </div>

                    {/* Links */}
                    <div className="px-2">
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-brand-600 transition-colors"
                        >
                            <User className="w-4 h-4" />
                            View Profile
                        </Link>
                        <Link
                            href="/profile/change-password"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-brand-600 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Change Password
                        </Link>
                    </div>

                    <div className="h-px bg-gray-100 my-1 mx-4"></div>

                    {/* Logout */}
                    <div className="px-2 mt-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
