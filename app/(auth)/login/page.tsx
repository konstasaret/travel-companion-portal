'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
  
    try {
      console.log('Starting login attempt...')
      
      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email')
      
      console.log('Profiles found:', profiles)
      
      if (profileError) {
        console.error('Profile error:', profileError)
        setError('Database error. Check console.')
        setLoading(false)
        return
      }
  
      if (!profiles || profiles.length === 0) {
        setError('No users found in database. Contact admin.')
        setLoading(false)
        return
      }
  
      // Try each profile
      let loginSuccess = false
      
      for (const profile of profiles) {
        console.log(`Trying email: ${profile.email}`)
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: passphrase,
        })
        
        if (signInError) {
          console.log(`Failed for ${profile.email}:`, signInError.message)
        } else if (data.user) {
          console.log('Login successful!')
          loginSuccess = true
          break
        }
      }
  
      if (loginSuccess) {
        router.push('/trips')
        router.refresh()
      } else {
        setError('Incorrect passphrase. Check console for details.')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Something went wrong. Check console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Travel Portal
          </h1>
          <p className="text-gray-600">
            Enter your personal passphrase to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 mb-2">
              Your Passphrase
            </label>
            <input
              id="passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="remember that time we..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              This is the unique phrase shared with you
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have access? Contact the admin.
        </p>
      </div>
    </div>
  )
}