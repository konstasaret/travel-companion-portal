import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/trips') // Non-admins go back to trips
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <div className="text-sm text-gray-300">
              {user.email}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            
             
             <a href="/admin/requests"
              className="px-3 py-4 text-sm font-medium text-gray-900 border-b-2 border-blue-600"
            >
              Pending Requests
            </a>
            
            <a
              href="/admin/trips"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Manage Trips
            </a>
            <a
              href="/trips"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View as User
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      {children}
    </div>
  )
}