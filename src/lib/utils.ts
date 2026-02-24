import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(date));
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

const roleAliases: Record<string, string> = {
    dealers: 'dealer',
    dealer_admin: 'dealer',
    channel_partner: 'dealer'
};

export function normalizeRole(rawRole: string | null | undefined): string {
    if (!rawRole) return 'user';
    const role = rawRole.toLowerCase().trim();
    return roleAliases[role] ?? role;
}

