import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function ensureAdmin() {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) throw new Error("No active session");
    if (session?.user?.role !== 'admin') throw new Error("Not authorized");
    
    return session
}
