import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

// Mocking requireAuth and requireRole until Clerk is fully setup
export async function requireAuth() {
    // Return a dummy user for development
    const user = await db.query.users.findFirst({
        where: eq(users.role, 'ceo')
    });

    if (!user) {
        // If no user exists, create a default admin
        const [newUser] = await db.insert(users).values({
            id: 'fc571565-a161-476e-82e4-1f30a4178f1b', // Using actual dev CEO UUID
            name: 'System Admin',
            email: 'admin@itarang.com',
            role: 'ceo',
        }).returning();
        return newUser;
    }

    return user;
}

export async function requireRole(roles: string[]) {
    const user = await requireAuth();
    if (!roles.includes(user.role)) {
        throw new Error('Forbidden: Insufficient permissions');
    }
    return user;
}
