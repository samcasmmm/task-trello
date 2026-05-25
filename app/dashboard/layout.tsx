import DashboardNav from '@/components/dashboard-nav'

export const metadata = {
  title: 'Dashboard | Task Management',
  description: 'Manage your projects and tasks',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardNav />
      <main className="flex-1 overflow-auto">
        <div className="container h-full max-w-full py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
