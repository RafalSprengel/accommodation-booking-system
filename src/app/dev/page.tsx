import { headers } from 'next/headers';
import DevLogin from './DevLogin';
import DevPageClient from './DevPageClient';

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

export default async function DevPage() {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');
  const devAuth = getCookieValue(cookieHeader, 'dev-auth');
  const isAuthorized = devAuth === '1';

  return isAuthorized ? <DevPageClient /> : <DevLogin />;
}
