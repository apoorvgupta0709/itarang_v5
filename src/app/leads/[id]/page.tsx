import { db } from '@/lib/db';
import { leads, leadAssignments, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import LeadAssignment from '@/components/leads/LeadAssignment';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: leadId } = await params;
    const user = await requireAuth();

    // Fetch Lead
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return <div className="p-8">Lead not found</div>;

    // Fetch Assignment
    const [assignment] = await db.select().from(leadAssignments).where(eq(leadAssignments.lead_id, leadId)).limit(1);

    // Fetch All Users for Dropdown (Optimization: could filter by role)
    const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);

    // Permission Logic
    const isSalesHead = ['sales_head', 'business_head', 'ceo'].includes(user.role);
    const isOwner = assignment?.lead_owner === user.id;

    const canAssignOwner = isSalesHead;
    const canAssignActor = isSalesHead || isOwner;

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
            </div>
        </div>
    );
}
