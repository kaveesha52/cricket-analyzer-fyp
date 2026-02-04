'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Trophy, Loader2, User, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('player')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)

  const handlePasswordChange = (e) => {
    const pwd = e.target.value
    setPassword(pwd)
    
    let strength = 0
    if (pwd.length > 6) strength++
    if (pwd.length > 10) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    setPasswordStrength(strength)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role,
        profileCompleted: false,
        createdAt: new Date().toISOString()
      })

      // Redirect to profile completion
      router.push('/complete-profile')
    } catch (error) {
      console.error('Registration error:', error)
      let errorMessage = 'Failed to register'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '❌ This email is already registered. Please login instead.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '❌ Password is too weak. Use at least 6 characters.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '❌ Invalid email address format.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-green-50 to-white flex items-center justify-center p-4 relative">
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-6 left-6">
        <Button variant="ghost" className="gap-2 hover:bg-white/50">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </Link>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        {/* Header Image */}
        <div className="h-40 bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1643294357573-36f3ed94ce4c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwzfHxjcmlja2V0fGVufDB8fHxibHVlfDE3Njk5NjUzMzB8MA&ixlib=rb-4.1.0&q=85"
              alt="Cricket"
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          <Trophy className="w-16 h-16 text-white relative z-10" />
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-2">Join Us!</h2>
            <p className="text-gray-600">Create your account to start tracking</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 animate-shake">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-700">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
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
                onChange={handlePasswordChange}
                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                placeholder="••••••••"
                required
              />
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passwordStrength === 0 ? 'w-0 bg-gray-300' :
                    passwordStrength === 1 ? 'w-1/4 bg-red-500' :
                    passwordStrength === 2 ? 'w-1/2 bg-yellow-500' :
                    passwordStrength === 3 ? 'w-3/4 bg-blue-500' :
                    'w-full bg-green-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 mb-3 block">I am a</Label>
              <RadioGroup value={role} onValueChange={setRole} className="flex space-x-4">
                <div className="flex items-center space-x-2 flex-1">
                  <RadioGroupItem value="player" id="player" />
                  <Label htmlFor="player" className="flex items-center cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Player
                  </Label>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <RadioGroupItem value="coach" id="coach" />
                  <Label htmlFor="coach" className="flex items-center cursor-pointer">
                    <Users className="w-4 h-4 mr-2" />
                    Coach
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}