'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Trip = {
    id: string
    title: string
    location: string
    start_date: string
    end_date: string
    max_companions: number
    status: string
    type: string
    notes: string
    companion_requests: { id: string; status: string; user_id: string }[]
  }

export default function TripCard({ trip, userId }: { trip: Trip; userId: string }) {
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const supabase = createClient()

  // Calculate available spots
  const approvedRequests = trip.companion_requests.filter(r => r.status === 'approved').length
  const availableSpots = trip.max_companions - approvedRequests

  // Determine actual trip status based on spots and manual status
  const getActualStatus = () => {
    if (trip.status === 'cancelled') return 'cancelled'
    if (trip.status === 'closed') return 'closed'
    if (availableSpots === 0) return 'full'
    return 'open'
  }

  const actualStatus = getActualStatus()

  // Check if THIS user has a pending request
const userHasPendingRequest = trip.companion_requests.some(r => 
    r.user_id === userId && r.status === 'pending'
  )
  
  // Check if THIS user is approved for this trip
  const userIsApproved = trip.companion_requests.some(r => 
    r.user_id === userId && r.status === 'approved'
  )

  const handleRequest = async () => {
    setRequesting(true)
    
    try {
      // Check if this user is a priority user
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_priority_user')
        .eq('id', userId)
        .single()
  
      const isPriority = profile?.is_priority_user || false
  
      // Insert request
      const { error } = await supabase
        .from('companion_requests')
        .insert({
          trip_id: trip.id,
          user_id: userId,
          status: 'pending',
          message: message || null,
          is_priority_user: isPriority,  // Set priority flag
        })
  
      if (error) throw error
  
      // Send email notification to admin
      await fetch('/api/notifications/trip-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripTitle: trip.title,
          tripLocation: trip.location,
          userMessage: message,
          isPriority: isPriority,  // Include in notification
        }),
      })
  
      alert('Request sent! You will receive an email once approved.')
      window.location.reload()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to send request. Please try again.')
    } finally {
      setRequesting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Status badge styling
  const getStatusBadge = () => {
    switch (actualStatus) {
      case 'open':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Open' }
      case 'full':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Full' }
      case 'closed':
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' }
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' }
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow ${
      actualStatus === 'cancelled' ? 'opacity-60' : ''
    }`}>
      {/* Header with gradient */}
      <div className="h-32 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
        <span className="text-5xl">✈️</span>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{trip.title}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.label}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4">{trip.location}</p>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <span className="mr-2">📅</span>
            <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">👥</span>
            <span>
              {actualStatus === 'cancelled' 
                ? 'Trip cancelled' 
                : actualStatus === 'closed'
                ? 'Trip closed'
                : availableSpots > 0 
                ? `${availableSpots} ${availableSpots === 1 ? 'spot' : 'spots'} available` 
                : 'No spots available'}
            </span>
          </div>
        </div>

        {trip.notes && (
          <p className="text-sm text-gray-500 mb-4 italic">{trip.notes}</p>
        )}

        {/* Request Button or Form */}
        {actualStatus === 'cancelled' ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg text-sm text-center font-medium">
            Trip Cancelled
          </div>
        ) : actualStatus === 'closed' ? (
          <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm text-center font-medium">
            Trip Closed
          </div>
        ) : userIsApproved ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm text-center font-medium">
            ✓ You're joining this trip!
          </div>
        ) : userHasPendingRequest ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm text-center">
            Request pending
          </div>
        ) : showRequestForm ? (
          <div className="space-y-3">
            <textarea
              placeholder="Add a message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleRequest}
                disabled={requesting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
              >
                {requesting ? 'Sending...' : 'Send Request'}
              </button>
              <button
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowRequestForm(true)}
            disabled={actualStatus === 'full' || availableSpots === 0}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {actualStatus === 'full' || availableSpots === 0 ? 'Trip Full' : 'Request to Join'}
          </button>
        )}
      </div>
    </div>
  )
}