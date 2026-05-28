import DashboardNav from '@/components/dashboard-nav';

export const metadata = {
  title: 'Dashboard | Task Management',
  description: 'Manage your projects and tasks',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex h-screen overflow-hidden' style={{ background: 'var(--background)' }}>
      <DashboardNav />
      <main className='flex-1 overflow-auto pt-12 md:pt-0'>
        <div className='max-w-full h-full px-6 py-6'>{children}</div>
      </main>
    </div>
  );
}
