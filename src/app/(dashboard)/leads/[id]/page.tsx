import { db } from '@/lib/db';
import { leads, leadAssignments, users, assignmentChangeLogs, bolnaCalls } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { requireAuth } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import LeadAssignment from '@/components/leads/LeadAssignment';
import CallLogs from '@/components/leads/CallLogs';
import { ArrowLeft, History as HistoryIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: leadId } = await params;
    const user = await requireAuth();

    // Fetch Lead with Error Boundary
    let lead;
    try {
        let result = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
        lead = result[0];

        if (!lead) {
            const normalized = leadId.startsWith('#') ? leadId : `#${leadId}`;
            result = await db.select().from(leads).where(eq(leads.reference_id, leadId)).limit(1);
            if (result.length > 0) {
                lead = result[0];
            } else {
                result = await db.select().from(leads).where(eq(leads.reference_id, normalized)).limit(1);
                lead = result[0];
            }
        }
    } catch (err: any) {
        if (err?.code === '42703' || err?.message?.includes('does not exist')) {
            return (
                <div className="max-w-4xl mx-auto py-8 px-4">
                    <Link href="/leads">
                        <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-brand-600">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leads
                        </Button>
                    </Link>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-red-700 mb-2">Database Schema Not Updated</h2>
                        <p className="text-red-600 mb-4">
                            The requested page requires columns that have not yet been migrated to the database.
                            Loading Lead ID: <strong>{leadId}</strong>
                        </p>

                        <h3 className="font-semibold text-gray-900 mt-6 mb-2">How to Fix</h3>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto whitespace-pre">
                            {`-- Please run the following SQL migration against your Supabase database:
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "reference_id" varchar(255);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "workflow_step" integer DEFAULT 1 NOT NULL;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lead_score" integer DEFAULT 30 NOT NULL;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_contact_at" timestamp with time zone;
CREATE UNIQUE INDEX IF NOT EXISTS "leads_ref_idx" ON "leads" ("reference_id");`}
                        </div>
                    </div>
                </div>
            );
        }

        console.error("Failed to load lead details:", err);
        return <div className="p-8">An error occurred while loading lead details. Please check server logs.</div>;
    }

    if (!lead) return <div className="p-8">Lead not found</div>;

    const canonicalLeadId = lead.id;

    // Fetch Assignment
    const [assignment] = await db.select().from(leadAssignments).where(eq(leadAssignments.lead_id, canonicalLeadId)).limit(1);

    // Fetch Bolna Calls
    const callLogsArr = await db.select()
        .from(bolnaCalls)
        .where(eq(bolnaCalls.lead_id, canonicalLeadId))
        .orderBy(desc(bolnaCalls.created_at));

    // Fetch All Users for Dropdown with roles for filtering
    const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
    }).from(users);

    // Permission Logic
    const isSalesHead = ['sales_head', 'business_head', 'ceo'].includes(user.role);
    const isOwner = assignment?.lead_owner === user.id;

    const canAssignOwner = isSalesHead;
    const canAssignActor = isSalesHead || isOwner;

    // Fetch History with user names
    const changedByUser = alias(users, 'changed_by_user');
    const oldUser = alias(users, 'old_user');
    const newUser = alias(users, 'new_user');

    const assignmentHistory = await db.select({
        id: assignmentChangeLogs.id,
        change_type: assignmentChangeLogs.change_type,
        change_reason: assignmentChangeLogs.change_reason,
        changed_at: assignmentChangeLogs.changed_at,
        changedByName: changedByUser.name,
        oldUserName: oldUser.name,
        newUserName: newUser.name,
    })
        .from(assignmentChangeLogs)
        .leftJoin(changedByUser, eq(assignmentChangeLogs.changed_by, changedByUser.id))
        .leftJoin(oldUser, eq(assignmentChangeLogs.old_user_id, oldUser.id))
        .leftJoin(newUser, eq(assignmentChangeLogs.new_user_id, newUser.id))
        .where(eq(assignmentChangeLogs.lead_id, canonicalLeadId))
        .orderBy(desc(assignmentChangeLogs.changed_at));

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Link href="/leads">
                <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-brand-600">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leads
                </Button>
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{lead.business_name || 'Unnamed Business'}</h1>
                        <p className="text-gray-500">Lead ID: {lead.id}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                            ${lead.interest_level === 'hot' ? 'bg-red-100 text-red-800' :
                                lead.interest_level === 'warm' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'}`}>
                            {lead.interest_level?.toUpperCase()} Interest
                        </span>
                        <div className="mt-2 text-sm text-gray-500">Status: {lead.lead_status?.toUpperCase()}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Contact Details</h3>
                        <div className="space-y-2 text-sm text-gray-900">
                            <p><span className="font-semibold">Owner Name:</span> {lead.owner_name}</p>
                            <p><span className="font-semibold">Contact:</span> {lead.owner_contact}</p>
                            <p><span className="font-semibold">Email:</span> {lead.owner_email || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Location & Business</h3>
                        <div className="space-y-2 text-sm text-gray-900">
                            <p><span className="font-semibold">City/State:</span> {lead.city}, {lead.state}</p>
                            <p><span className="font-semibold">Address:</span> {lead.shop_address || 'N/A'}</p>
                            <p><span className="font-semibold">Source:</span> {lead.lead_source}</p>
                        </div>
                    </div>
                </div>

                <LeadAssignment
                    leadId={lead.id}
                    currentOwnerId={assignment?.lead_owner}
                    currentActorId={assignment?.lead_actor || undefined}
                    users={allUsers}
                    canAssignOwner={canAssignOwner}
                    canAssignActor={canAssignActor}
                />

                <CallLogs logs={callLogsArr} />

                {/* Assignment History */}
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="bg-brand-100 text-brand-600 p-1 rounded mr-2">
                            <HistoryIcon size={18} />
                        </span>
                        Assignment History
                    </h3>

                    <div className="space-y-4">
                        {assignmentHistory.length > 0 ? (
                            assignmentHistory.map((log) => (
                                <div key={log.id} className="flex gap-4 text-sm">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
                                        <div className="w-px flex-1 bg-gray-200 my-1" />
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-gray-900">
                                            <span className="font-semibold">{log.changedByName}</span>
                                            {' '}{log.change_type.replace('_', ' ')}
                                            {log.newUserName && <span> to <span className="font-medium">{log.newUserName}</span></span>}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-1">
                                            {new Date(log.changed_at).toLocaleString()}
                                            {log.change_reason && ` • Reason: ${log.change_reason}`}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-sm">No assignment history records found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
