"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Loader2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    type: string;
    href: string;
}

interface SearchCategory {
    category: string;
    items: SearchResult[];
}

export function GlobalSearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [results, setResults] = useState<SearchCategory[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial setup
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            const saved = localStorage.getItem('itarang_recent_searches');
            if (saved) {
                try { setRecentSearches(JSON.parse(saved)); } catch (e) { }
            }
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Fetch results
    useEffect(() => {
        const fetchResults = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search/global?q=${encodeURIComponent(debouncedQuery)}`);
                const data = await res.json();
                setResults(data.results || []);
            } catch (error) {
                console.error("Search failed", error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };
        fetchResults();
    }, [debouncedQuery]);

    const handleSelectResult = (href: string, title: string) => {
        const newRecent = [title, ...recentSearches.filter(t => t !== title)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('itarang_recent_searches', JSON.stringify(newRecent));
        onClose();
        router.push(href);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-24 px-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input Box */}
                <div className="relative flex items-center px-4 border-b border-gray-100">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search leads, customers, loans, assets..."
                        className="w-full py-4 pl-3 pr-10 text-base bg-transparent border-none outline-none placeholder-gray-400 text-gray-900"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 absolute right-4">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto w-full">
                    {query.length < 2 && recentSearches.length > 0 && (
                        <div className="py-2">
                            <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Recent Searches
                            </h3>
                            <ul>
                                {recentSearches.map((term, i) => (
                                    <li key={i}>
                                        <button
                                            onClick={() => setQuery(term)}
                                            className="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-50 text-gray-700 text-sm"
                                        >
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            {term}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {query.length >= 2 && isSearching && (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    )}

                    {query.length >= 2 && !isSearching && results.length === 0 && (
                        <div className="py-12 text-center text-gray-500">
                            <p>No results found for "{query}"</p>
                            <p className="text-sm mt-1 text-gray-400">Try searching for a different term or ID</p>
                        </div>
                    )}

                    {query.length >= 2 && !isSearching && results.map((category, i) => (
                        <div key={i} className="py-2">
                            <h3 className="px-4 pt-2 pb-1 text-xs font-semibold text-brand-600 uppercase tracking-wider flex items-center gap-2">
                                {category.category}
                                <span className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded text-[10px]">{category.items.length}</span>
                            </h3>
                            <ul>
                                {category.items.map((item, j) => (
                                    <li key={j}>
                                        <button
                                            onClick={() => handleSelectResult(item.href, item.title)}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left group border-l-2 border-transparent hover:border-brand-500 transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{item.title}</span>
                                                <span className="text-xs text-gray-500 mt-0.5">{item.subtitle}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Footer Help text */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div>
                        Search by <span className="font-medium text-gray-700">Name</span>, <span className="font-medium text-gray-700">Phone</span>, or <span className="font-medium text-gray-700">ID</span>
                    </div>
                    <div className="flex items-center gap-1">
                        Press <kbd className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5">esc</kbd> to close
                    </div>
                </div>
            </div>
        </div>
    );
}
