import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend';


export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()
    const supabase = await createClient()
    
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

    const { data: requestData } = await supabase
  .from('companion_requests')
  .select('*')
  .eq('id', requestId)
  .single();

if (!requestData) {
  return NextResponse.json({ error: 'Request not found' }, { status: 404 });
}
    // Reject request
    const { error } = await supabase
      .from('companion_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', requestId)

      if (error) throw error

      // Fetch trip and user info and send rejection email
      const [{ data: trip }, { data: userProfile }] = await Promise.all([
        supabase.from('trips').select('title').eq('id', requestData.trip_id).single(),
        supabase.from('profiles').select('email').eq('id', requestData.user_id).single(),
      ]);
      
      if (userProfile?.email) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: userProfile.email,
          subject: `Update about your trip request${trip?.title ? `: ${trip.title}` : ''}`,
          html: `
            <div>
              <p><strong>Your request was not accepted.</strong></p>
              <p>We appreciate your interest.</p>
            </div>
          `,
        }).catch((e) => console.error('Resend error (reject):', e));
      }
      
      
      console.log('Request rejected')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}