import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email?: string, name?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || '',
        name: name || (email ? email.split('@')[0] : 'Farmer'),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || '',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create user in Cloud SQL:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
