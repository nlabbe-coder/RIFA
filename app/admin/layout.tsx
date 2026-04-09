import { getAdminSession } from '@/lib/auth'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()

  // Si no hay sesión (ej: página de login), renderizar solo el contenido
  if (!session) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar nombre={session.nombre} />
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
