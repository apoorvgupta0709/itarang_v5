import { db } from '@/lib/db';
import { users, leads, leadAssignments, deals, inventory, orders } from '@/lib/db/schema';
import { eq, gte, sql, and, desc, count } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { successResponse, withErrorHandler } from '@/lib/api-utils';

export const GET = withErrorHandler(async (req: Request, { params }: { params: Promise<{ role: string }> }) => {
    const user = await requireAuth();
    const { role } = await params;

    // Verify requesting user role or CEO access
    if (user.role !== role && user.role !== 'ceo') {
        throw new Error('Forbidden: You can only access your own dashboard metrics');
    }

    const now = new Date();
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    if (role === 'ceo') {
        // 1. Revenue MTD
        const [revenueResult] = await db
            .select({ revenue: sql<number>`COALESCE(SUM(total_payable), 0)` })
            .from(deals)
            .where(and(
                eq(deals.deal_status, 'converted'),
                gte(deals.created_at, startOfMonthDate)
            ));

        // 2. Conversion Rate
        const [conversionResult] = await db
            .select({
                total_leads: sql<number>`COUNT(*)`,
                conversions: sql<number>`COUNT(*) FILTER (WHERE lead_status = 'converted')`,
            })
            .from(leads)
            .where(gte(leads.created_at, startOfMonthDate));

        // 3. Inventory Value
        const [inventoryResult] = await db
            .select({ inventoryValue: sql<number>`COALESCE(SUM(final_amount), 0)` })
            .from(inventory)
            .where(eq(inventory.status, 'available'));

        // 4. Outstanding Credits (Unpaid orders)
        const [creditResult] = await db
            .select({ outstandingCredits: sql<number>`COALESCE(SUM(total_payable), 0)` })
            .from(orders)
            .where(and(
                eq(orders.payment_term, 'credit'),
                eq(orders.payment_status, 'unpaid')
            ));

        return successResponse({
            revenue: revenueResult?.revenue || 0,
            conversionRate: conversionResult?.total_leads ? (conversionResult.conversions / conversionResult.total_leads) * 100 : 0,
            inventoryValue: inventoryResult?.inventoryValue || 0,
            outstandingCredits: creditResult?.outstandingCredits || 0,
            lastUpdated: new Date().toISOString()
        });
    }

    if (role === 'sales_manager') {
        // Lead stats for this manager
        const [leadStats] = await db
            .select({
                activeLeads: count(),
                hotLeads: sql<number>`COUNT(*) FILTER (WHERE lead_status = 'hot')`,
            })
            .from(leads)
            .innerJoin(leadAssignments, eq(leads.id, leadAssignments.lead_id))
            .where(eq(leadAssignments.lead_owner, user.id));

        return successResponse({
            activeLeads: leadStats?.activeLeads || 0,
            hotLeads: leadStats?.hotLeads || 0,
            pipelineValue: 1850000, // Mock for now until deal-product links are active
            lastUpdated: new Date().toISOString()
        });
    }

    if (role === 'business_head') {
        const [stats] = await db
            .select({
                activeLeads: count(),
                pendingApprovals: sql<number>`COUNT(*) FILTER (WHERE lead_status = 'qualified')`,
            })
            .from(leads);

        return successResponse({
            activeLeads: stats?.activeLeads || 0,
            pendingApprovals: stats?.pendingApprovals || 0,
            conversionRate: 18.5,
            avgQualificationTime: '1.8 Days',
            leadTrend: [
                { name: 'Week 1', total: 45, qualified: 28 },
                { name: 'Week 2', total: 52, qualified: 32 },
                { name: 'Week 3', total: 48, qualified: 30 },
                { name: 'Week 4', total: 61, qualified: 42 },
            ],
            categoryStats: [
                { name: '3W Li-ion', count: 145 },
                { name: '2W Li-ion', count: 88 },
                { name: 'L5 High Speed', count: 56 },
                { name: 'E-Rickshaw Standard', count: 123 },
            ],
            lastUpdated: new Date().toISOString()
        });
    }

    if (role === 'sales_head') {
        const [revenue] = await db
            .select({ total: sql<number>`SUM(total_amount)` })
            .from(orders);

        return successResponse({
            targetAchievement: 72,
            pipelineRevenue: '₹12.8 Cr',
            totalRevenue: revenue?.total || 0,
            regionalPerformance: [
                { name: 'North West', Revenue: 185, Target: 150 },
                { name: 'NCR', Revenue: 120, Target: 140 },
                { name: 'Central India', Revenue: 95, Target: 80 },
                { name: 'East', Revenue: 45, Target: 60 },
                { name: 'SouthWest', Revenue: 110, Target: 100 },
            ],
            lastUpdated: new Date().toISOString()
        });
    }

    if (role === 'finance_controller') {
        const [financeStats] = await db
            .select({
                unpaidOrders: count(sql`CASE WHEN payment_status = 'unpaid' THEN 1 END`),
                totalReceivables: sql<number>`SUM(CASE WHEN payment_status = 'unpaid' THEN total_amount ELSE 0 END)`,
            })
            .from(orders);

        return successResponse({
            pendingApprovals: 8,
            receivablesTotal: financeStats?.totalReceivables || 0,
            unpaidOrders: financeStats?.unpaidOrders || 0,
            agingData: [
                { name: '0-30 Days', Amount: 42.5 },
                { name: '31-60 Days', Amount: 24.2 },
                { name: '61-90 Days', Amount: 12.8 },
                { name: '90+ Days', Amount: 4.7 },
            ],
            lastUpdated: new Date().toISOString()
        });
    }

    if (role === 'service_engineer') {
        return successResponse({
            pendingPDI: 6,
            inspectionsToday: '4/8',
            failureRate: '5.2%',
            avgPDITime: '18 min',
            pdiTrend: [
                { name: 'Mon', Pass: 12, Fail: 1 },
                { name: 'Tue', Pass: 15, Fail: 2 },
                { name: 'Wed', Pass: 10, Fail: 0 },
                { name: 'Thu', Pass: 18, Fail: 3 },
                { name: 'Fri', Pass: 14, Fail: 1 },
            ],
            lastUpdated: new Date().toISOString()
        });
    }

    if (role === 'sales_order_manager') {
        const [orderStats] = await db
            .select({
                pendingDispatch: count(sql`CASE WHEN shipping_status = 'pending' THEN 1 END`),
                inTransit: count(sql`CASE WHEN shipping_status = 'in_transit' THEN 1 END`),
            })
            .from(orders);

        return successResponse({
            pendingDispatch: orderStats?.pendingDispatch || 0,
            inTransit: orderStats?.inTransit || 0,
            fulfillmentTime: '2.4 Days',
            fulfillmentTrend: [
                { name: 'Mon', Received: 28, Dispatched: 25 },
                { name: 'Tue', Received: 35, Dispatched: 32 },
                { name: 'Wed', Received: 42, Dispatched: 38 },
                { name: 'Thu', Received: 38, Dispatched: 40 },
                { name: 'Fri', Received: 45, Dispatched: 42 },
            ],
            lastUpdated: new Date().toISOString()
        });
    }

    return successResponse({ message: `Dashboard for role ${role} is under construction` });
});
