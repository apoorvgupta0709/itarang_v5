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
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Core stats
        const [stats] = await db
            .select({
                activeLeads: count(),
                pendingApprovals: sql<number>`COUNT(*) FILTER (WHERE lead_status = 'qualified' OR lead_status = 'pending_l1_approval')`,
                conversions: sql<number>`COUNT(*) FILTER (WHERE lead_status = 'converted')`,
            })
            .from(leads);

        // 2. Lead Trend (Last 4 weeks)
        const weeklyTrend = await db.execute(sql`
            SELECT 
                DATE_TRUNC('week', created_at) as week,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE lead_status IN ('qualified', 'converted')) as qualified
            FROM leads
            WHERE created_at >= NOW() - INTERVAL '4 weeks'
            GROUP BY 1
            ORDER BY 1 ASC
        `);

        // 3. Category Stats
        const categoryStats = await db.execute(sql`
            SELECT 
                COALESCE(pc.asset_category, 'Unknown') as name,
                COUNT(l.id) as count
            FROM leads l
            CROSS JOIN LATERAL jsonb_array_elements_text(l.interested_in) as interested_id
            LEFT JOIN product_catalog pc ON pc.id = interested_id
            GROUP BY 1
            ORDER BY 2 DESC
        `);

        // 4. Level 2 Approval Queue (Sample for the integrated table)
        const approvalQueue = await db
            .select({
                id: deals.id,
                oem: sql<string>`'Sample OEM'`, // Placeholder until join fixed
                value: deals.total_payable,
                item: sql<string>`'Sample Item'`, // Placeholder
                status: deals.deal_status,
                created_at: deals.created_at
            })
            .from(deals)
            .where(eq(deals.deal_status, 'pending_approval_l2'))
            .limit(5);

        return successResponse({
            activeLeads: stats?.activeLeads || 0,
            pendingApprovals: stats?.pendingApprovals || 0,
            conversionRate: stats?.activeLeads ? ((stats.conversions / stats.activeLeads) * 100).toFixed(1) : 0,
            avgQualificationTime: '1.8 Days', // Still mock for now
            leadTrend: weeklyTrend.map(w => ({
                name: new Date(w.week as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                total: w.total,
                qualified: w.qualified
            })),
            categoryStats: categoryStats,
            approvalQueue: approvalQueue,
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
        // 1. Core Receivables Stats
        const [financeStats] = await db
            .select({
                unpaidOrders: count(sql`CASE WHEN payment_status = 'unpaid' THEN 1 END`),
                totalReceivables: sql<number>`SUM(CASE WHEN payment_status = 'unpaid' THEN total_amount ELSE 0 END)`,
            })
            .from(orders);

        // 2. Pending Approvals (Level 3)
        const [approvalStats] = await db
            .select({ pending: count() })
            .from(deals)
            .where(eq(deals.deal_status, 'pending_approval_l3'));

        // 3. Aging Data
        const agingBuckets = await db.execute(sql`
            SELECT 
                CASE 
                    WHEN created_at >= NOW() - INTERVAL '30 days' THEN '0-30 Days'
                    WHEN created_at >= NOW() - INTERVAL '60 days' THEN '31-60 Days'
                    WHEN created_at >= NOW() - INTERVAL '90 days' THEN '61-90 Days'
                    ELSE '90+ Days'
                END as name,
                SUM(total_amount) as amount
            FROM orders
            WHERE payment_status = 'unpaid'
            GROUP BY 1
        `);

        // 4. Invoicing Queue
        const invoicingQueue = await db
            .select({
                id: deals.id,
                name: sql<string>`'Sample Customer'`, // Placeholder
                amount: deals.total_payable,
                date: deals.created_at
            })
            .from(deals)
            .where(eq(deals.deal_status, 'payment_awaited'))
            .limit(10);

        return successResponse({
            pendingApprovals: approvalStats?.pending || 0,
            receivablesTotal: financeStats?.totalReceivables || 0,
            unpaidOrders: financeStats?.unpaidOrders || 0,
            agingData: agingBuckets,
            invoicingQueue: invoicingQueue,
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
