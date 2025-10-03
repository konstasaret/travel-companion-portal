import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()
    const supabase = await createClient()
    
    console.log('Approving request:', requestId)
    
    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Not admin' }, { status: 403 })
    }

    // Get request details (simplified - no complex joins)
    const { data: requestData, error: fetchError } = await supabase
      .from('companion_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    console.log('Request data:', requestData)
    console.log('Fetch error:', fetchError)

    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Approve request (trigger will check capacity)
    const { error: updateError } = await supabase
      .from('companion_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', requestId)

    console.log('Update error:', updateError)

    if (updateError) {
      // If trigger blocks it due to capacity
      if (updateError.message?.includes('full')) {
        return NextResponse.json(
          { error: 'Trip is full. Cannot approve more requests.' }, 
          { status: 400 }
        )
      }
      throw updateError
    }

    // Get trip and profile info for logging
    const { data: trip } = await supabase
      .from('trips')
      .select('title')
      .eq('id', requestData.trip_id)
      .single()

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', requestData.user_id)
      .single()

    console.log('=== REQUEST APPROVED ===')
    console.log(`User: ${userProfile?.email}`)
    console.log(`Trip: ${trip?.title}`)
    console.log('========================')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error approving request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal error' }, 
      { status: 500 }
    )
  }
}