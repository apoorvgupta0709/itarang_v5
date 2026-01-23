import path from 'path';
import { config } from 'dotenv';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from './src/lib/db';
import { users } from './src/lib/db/schema';

async function main() {
    try {
        const allUsers = await db.select().from(users);
        console.log('--- USERS IN DATABASE ---');
        console.table(allUsers.map(u => ({ id: u.id, email: u.email, role: u.role, name: u.name })));
    } catch (err) {
        console.error('Failed to query users:', err);
    }
    process.exit(0);
}

main();
