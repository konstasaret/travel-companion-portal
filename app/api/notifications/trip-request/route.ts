import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { tripTitle, tripLocation, userMessage } = await request.json()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single()

    // For now, just log to console
    // We'll add actual email sending with Resend later
    console.log('=== NEW TRIP REQUEST ===')
    console.log(`From: ${profile?.display_name || profile?.email || user.email}`)
    console.log(`Trip: ${tripTitle} (${tripLocation})`)
    console.log(`Message: ${userMessage || 'No message'}`)
    console.log('========================')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}