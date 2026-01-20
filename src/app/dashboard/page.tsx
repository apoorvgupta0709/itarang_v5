import { requireAuth } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const user = await requireAuth();

    // Role-based redirection mapping as per SOP Section 4.1
    const roleDashboards: Record<string, string> = {
        ceo: '/dashboard/ceo',
        business_head: '/dashboard/business-head',
        sales_head: '/dashboard/sales-head',
        sales_manager: '/dashboard/sales-manager',
        finance_controller: '/dashboard/finance-controller',
        inventory_manager: '/dashboard/inventory-manager',
        service_engineer: '/dashboard/service-engineer',
        sales_order_manager: '/dashboard/sales-order-manager',
        dealer: '/dashboard/dealer-portal',
    };

    const targetPath = roleDashboards[user.role];

    if (targetPath) {
        redirect(targetPath);
    }

    // Default fallback
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="card-parcel p-6 bg-white shadow-sm border border-gray-100 rounded-xl">
                <p className="text-gray-600">Your role doesn't have a specific dashboard assigned yet. Please contact support.</p>
            </div>
        </div>
    );
}
