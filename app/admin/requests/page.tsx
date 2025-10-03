import { createClient } from '@/lib/supabase/server'
import RequestCard from '@/app/admin/requests/request-card'

export default async function AdminRequestsPage() {
  const supabase = await createClient()

  // Get all pending requests - simpler query
  const { data: requests, error } = await supabase
    .from('companion_requests')
    .select('*')
    .eq('status', 'pending')
    .order('is_priority_user', { ascending: false })
    .order('requested_at', { ascending: true })

  console.log('Raw requests:', requests)
  console.log('Query error:', error)

  // Enrich each request with trip and profile data
  const enrichedRequests = []
  
  if (requests) {
    for (const request of requests) {
      // Get trip info
      const { data: trip } = await supabase
        .from('trips')
        .select('id, title, location, start_date, end_date, max_companions, status')
        .eq('id', request.trip_id)
        .single()

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email, is_priority_user')
        .eq('id', request.user_id)
        .single()

      if (trip && profile) {
        enrichedRequests.push({
          ...request,
          trips: trip,
          profiles: profile
        })
      }
    }
  }

  console.log('Enriched requests:', enrichedRequests.length)

  // Count by status
  const { count: pendingCount } = await supabase
    .from('companion_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: approvedCount } = await supabase
    .from('companion_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending Requests</div>
          <div className="text-3xl font-bold text-yellow-600">{pendingCount || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Approved Requests</div>
          <div className="text-3xl font-bold text-green-600">{approvedCount || 0}</div>
        </div>
      </div>

      {/* Requests List */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Requests</h2>

      {enrichedRequests && enrichedRequests.length > 0 ? (
        <div className="space-y-4">
          {enrichedRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">No pending requests</p>
          <p className="text-gray-500 text-sm mt-2">All caught up!</p>
        </div>
      )}
    </main>
  )
}