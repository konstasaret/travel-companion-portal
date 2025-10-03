import { createClient } from '@/lib/supabase/server'
import TripCard from '@/app/trips/trip-card'

export default async function TripsPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Please log in</div>
  }

  // Get all open trips
  const { data: trips } = await supabase
  .from('trips')
  .select(`
    *,
    companion_requests(id, status, user_id)
  `)
  .order('start_date', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Available Trips</h1>
            <div className="text-sm text-gray-600">
              Logged in as {user.email?.split('@')[0]}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} userId={user.id} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No trips available yet.</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon for new adventures!</p>
          </div>
        )}
      </main>
    </div>
  )
}