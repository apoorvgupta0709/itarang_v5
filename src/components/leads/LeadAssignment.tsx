'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
}

interface LeadAssignmentProps {
    leadId: string;
    currentOwnerId?: string;
    currentActorId?: string;
    users: User[];
    canAssignOwner: boolean;
    canAssignActor: boolean;
}

export default function LeadAssignment({
    leadId,
    currentOwnerId,
    currentActorId,
    users,
    canAssignOwner,
    canAssignActor
}: LeadAssignmentProps) {
    const router = useRouter();
    const [selectedOwner, setSelectedOwner] = useState(currentOwnerId || '');
    const [selectedActor, setSelectedActor] = useState(currentActorId || '');
    const [loading, setLoading] = useState(false);

    const handleAssign = async (type: 'owner' | 'actor') => {
        setLoading(true);
        try {
            const body = type === 'owner'
                ? { lead_owner: selectedOwner }
                : { lead_actor: selectedActor };

            const res = await fetch(`/api/leads/${leadId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Assignment failed');
            }

            alert('Assignment updated successfully');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!canAssignOwner && !canAssignActor) return null;

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Management</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owner Assignment */}
                <div className="space-y-3">
                    <Label>Lead Owner (Accountable)</Label>
                    <div className="flex gap-2">
                        <Select
                            value={selectedOwner}
                            onChange={(e) => setSelectedOwner(e.target.value)}
                            disabled={!canAssignOwner || loading}
                            className="bg-white"
                        >
                            <option value="">Select Owner</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </Select>
                        {canAssignOwner && (
                            <Button
                                size="sm"
                                onClick={() => handleAssign('owner')}
                                disabled={loading || selectedOwner === currentOwnerId}
                            >
                                Assign
                            </Button>
                        )}
                    </div>
                    {!canAssignOwner && <p className="text-xs text-gray-500">Only Sales Head can change Owner.</p>}
                </div>

                {/* Actor Assignment */}
                <div className="space-y-3">
                    <Label>Lead Actor (Executional)</Label>
                    <div className="flex gap-2">
                        <Select
                            value={selectedActor}
                            onChange={(e) => setSelectedActor(e.target.value)}
                            disabled={!canAssignActor || loading}
                            className="bg-white"
                        >
                            <option value="">Select Actor</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </Select>
                        {canAssignActor && (
                            <Button
                                size="sm"
                                onClick={() => handleAssign('actor')}
                                disabled={loading || selectedActor === currentActorId}
                            >
                                Assign
                            </Button>
                        )}
                    </div>
                    {!canAssignActor && <p className="text-xs text-gray-500">Only Owner or Sales Head can assign Actor.</p>}
                </div>
            </div>
        </div>
    );
}
