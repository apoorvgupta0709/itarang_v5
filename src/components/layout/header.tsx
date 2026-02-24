"use client";

import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { ProfileDropdown } from '@/components/header/ProfileDropdown';
import { GlobalSearchOverlay } from '@/components/search/GlobalSearchOverlay';

export function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <h2 className="text-lg font-bold text-gray-700 md:hidden">iTarang</h2>
                    <div className="relative w-full hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="w-full text-left pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm text-gray-400 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-100"
                        >
                            Search leads, customers, loans, assets...
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="md:hidden relative p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors shadow-sm focus:outline-none"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    <button className="relative p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors shadow-sm focus:outline-none">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    <ProfileDropdown />
                </div>
            </header>

            <GlobalSearchOverlay
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    );
}
