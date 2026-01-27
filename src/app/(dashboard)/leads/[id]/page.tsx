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

    // Fetch Lead
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return <div className="p-8">Lead not found</div>;

    // Fetch Assignment
    const [assignment] = await db.select().from(leadAssignments).where(eq(leadAssignments.lead_id, leadId)).limit(1);

    // Fetch Bolna Calls
    const callLogsArr = await db.select()
        .from(bolnaCalls)
        .where(eq(bolnaCalls.lead_id, leadId))
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
        .where(eq(assignmentChangeLogs.lead_id, leadId))
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
