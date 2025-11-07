import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect('/sign-in');

  return (
    <main className="min-h-screen text-gray-400">
      <div className="container py-10">{children}</div>
    </main>
  );
};
export default Layout;
