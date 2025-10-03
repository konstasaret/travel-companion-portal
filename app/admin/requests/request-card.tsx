'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Request = {
  id: string
  message: string
  requested_at: string
  is_priority_user: boolean
  trips: {
    id: string
    title: string
    location: string
    start_date: string
    end_date: string
    max_companions: number
    status: string
  }
  profiles: {
    display_name: string
    email: string
    is_priority_user: boolean
  }
}

export default function RequestCard({ request }: { request: Request }) {
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    setProcessing(true)
    
    try {
      const response = await fetch('/api/admin/approve-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve')
      }

      alert('Request approved! User will be notified.')
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this request?')) {
      return
    }

    setProcessing(true)
    
    try {
      const response = await fetch('/api/admin/reject-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject')
      }

      alert('Request rejected. User will be notified.')
      router.refresh()
    } catch (error) {
      alert('Failed to reject request')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between">
        {/* Left side - User info and trip */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {request.profiles.display_name || request.profiles.email.split('@')[0]}
                {request.is_priority_user && (
                  <span className="px-2 py-0.5 bg-pink-100 text-pink-800 text-xs font-medium rounded-full">
                    Priority
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">{request.profiles.email}</p>
            </div>
          </div>

          <div className="ml-15 space-y-2">
            <div>
              <span className="text-sm text-gray-600">Wants to join: </span>
              <span className="font-medium text-gray-900">{request.trips.title}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>📍 {request.trips.location}</span>
              <span>📅 {formatDate(request.trips.start_date)} - {formatDate(request.trips.end_date)}</span>
            </div>
            {request.message && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 italic">"{request.message}"</p>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Requested {timeAgo(request.requested_at)}
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex gap-2 ml-6">
          <button
            onClick={handleApprove}
            disabled={processing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            disabled={processing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}