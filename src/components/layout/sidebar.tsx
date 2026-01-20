"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Users, FileText, LogOut, Phone, PieChart, Package, FileCheck, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const roleNavigation: Record<string, any[]> = {
    ceo: [
        { section: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/ceo' }] },
        {
            section: 'BUSINESS', items: [
                { id: 'product-catalog', label: 'Product Catalog', icon: Package, href: '/product-catalog' },
                { id: 'oems', label: 'OEMs', icon: Landmark, href: '/oem-onboarding' },
                { id: 'inventory-reports', label: 'Inventory', icon: PieChart, href: '/inventory' },
                { id: 'leads', label: 'Leads', icon: Users, href: '/sales/leads' },
                { id: 'deals', label: 'Deals', icon: FileCheck, href: '/sales/deals' },
            ]
        },
    ],
    sales_head: [
        { section: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/sales-head' }] },
        {
            section: 'SALES', items: [
                { id: 'leads', label: 'Leads', icon: Users, href: '/sales/leads' },
                { id: 'deals', label: 'Deals', icon: FileCheck, href: '/sales/deals' },
                { id: 'approvals', label: 'Approvals', icon: FileText, href: '/dashboard/sales-head/approvals' },
            ]
        },
    ],
    sales_manager: [
        { section: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/sales-manager' }] },
        {
            section: 'SALES', items: [
                { id: 'leads', label: 'My Leads', icon: Users, href: '/sales/leads' },
                { id: 'deals', label: 'My Deals', icon: FileCheck, href: '/sales/deals' },
                { id: 'ai-calls', label: 'AI Calls', icon: Phone, href: '/dashboard/sales-manager/ai-calls' },
            ]
        },
    ],
    inventory_manager: [
        { section: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/inventory-manager' }] },
        {
            section: 'INVENTORY', items: [
                { id: 'product-catalog', label: 'Product Catalog', icon: Package, href: '/product-catalog' },
                { id: 'inventory-reports', label: 'Inventory', icon: PieChart, href: '/inventory' },
                { id: 'bulk-upload', label: 'Bulk Upload', icon: ShoppingCart, href: '/inventory/bulk-upload' },
            ]
        },
    ],
    service_engineer: [
        { section: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/service-engineer' }] },
        {
            section: 'PDI', items: [
                { id: 'pdi-queue', label: 'PDI Queue', icon: FileCheck, href: '/dashboard/service-engineer/pdi-queue' },
            ]
        },
    ],
};

import { useAuth } from '@/components/auth/AuthProvider';

export function Sidebar() {
    const pathname = usePathname();
    const { user, loading } = useAuth();

    if (loading || !user) {
        return <div className="w-64 bg-slate-50/50 h-full border-r border-gray-100 hidden md:flex animate-pulse" />;
    }

    const userRole = user.role;
    const menuItems = roleNavigation[userRole] || [];

    return (
        <div className="w-64 bg-slate-50/50 h-full border-r border-gray-100 flex flex-col fixed left-0 top-0 z-10 hidden md:flex">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm opacity-50 rotate-45"></div>
                </div>
                <span className="text-xl font-bold text-gray-800 tracking-tight">iTarang</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-8">
                {menuItems.map((group: any) => (
                    <div key={group.section}>
                        <h3 className="text-xs font-semibold text-gray-400 mb-3 px-2 tracking-wider">{group.section}</h3>
                        <div className="space-y-1">
                            {group.items.map((item: any) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                                            isActive
                                                ? "bg-brand-50 text-brand-700 shadow-sm"
                                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-brand-600 rounded-r-full" />
                                        )}
                                        <item.icon className={cn("w-5 h-5", isActive ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600")} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* User Profile Section Placeholder */}
            <div className="p-4 border-t border-gray-100/50 space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group cursor-default">
                    <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm uppercase">
                        {user.name?.[0] || user.email?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name || 'User'}</p>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 bg-brand-100 text-brand-700 uppercase">
                            {user.role}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
