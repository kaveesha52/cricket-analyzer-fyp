'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trophy, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        
        if (userData.role === 'coach') {
          router.push('/coach/dashboard')
        } else {
          router.push('/player/dashboard')
        }
      } else {
        // If no user document exists, default to player
        router.push('/player/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Failed to login'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '❌ No account found with this email. Please register first.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '❌ Incorrect password. Please try again.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '❌ Invalid email address format.'
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = '❌ Invalid credentials. Please check your email and password.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '❌ Too many failed attempts. Please try again later.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex items-center justify-center p-4 relative">
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-6 left-6">
        <Button variant="ghost" className="gap-2 hover:bg-white/50">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </Link>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        {/* Header Image */}
        <div className="h-40 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1629285483773-6b5cde2171d7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxjcmlja2V0fGVufDB8fHxibHVlfDE3Njk5NjUzMzB8MA&ixlib=rb-4.1.0&q=85"
              alt="Cricket"
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          <Trophy className="w-16 h-16 text-white relative z-10" />
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600">Sign in to continue your cricket journey</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 animate-shake">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/register" className="text-green-600 hover:text-green-700 font-medium">
              New user? Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}