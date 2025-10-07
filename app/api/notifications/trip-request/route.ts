import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL, APP_URL } from '@/lib/resend';


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

    // Find admins from profiles
    const { data: admins } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('is_admin', true);

    const adminEmails = (admins || [])
    .map(a => a?.email)
    .filter((e): e is string => !!e);

    // Fallback to ADMIN_EMAIL if no admins found in DB
    if ((!adminEmails || adminEmails.length === 0) && process.env.ADMIN_EMAIL) {
    adminEmails.push(process.env.ADMIN_EMAIL);
    }

    if (adminEmails.length) {
    const requesterName = profile?.display_name || profile?.email || user.email || 'Unknown user';
    const adminLink = `${APP_URL}/admin/requests`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmails,
      subject: `New trip request: ${tripTitle} (${tripLocation})`,
      html: `
        <div>
          <p><strong>New trip request</strong></p>
          <p><strong>User:</strong> ${requesterName}</p>
          <p><strong>Trip:</strong> ${tripTitle} (${tripLocation})</p>
          <p><strong>Message:</strong> ${userMessage || 'No message'}</p>
          <p><a href="${adminLink}">Review requests</a></p>
        </div>
      `,
    }).catch((e) => console.error('Resend error (admin trip-request):', e));
    }

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